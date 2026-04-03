import formidable from "formidable";
import axios from "axios";
import fs from "fs";
import appConfig from "@/config";
import { getLesionDataById } from "@/lib/lesion-info";

// ✅ Pages Router: must disable default bodyParser for multipart/form-data
export const config = {
    api: {
        bodyParser: false,
    },
};

// ===== Token management =====
let apiToken = null;
let tokenExpiration = 0;

async function fetchToken() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing CLIENT_ID / CLIENT_SECRET in env");
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await axios.post(
        appConfig.TOKEN_URL,
        {
            client_id: clientId,
            client_secret: clientSecret,
            audience: appConfig.AUDIENCE,
            grant_type: "client_credentials",
        },
        {
            headers: {
                "Content-Type": "application/json",
                // ✅ IMPORTANT: token API requires Authorization header
                Authorization: `Basic ${basic}`,
            },
            validateStatus: () => true,
        }
    );

    if (response.status !== 200) {
        // log full error payload from token server
        throw new Error(
            `Token request failed (${response.status}): ${JSON.stringify(response.data)}`
        );
    }

    const { access_token, expires_in } = response.data;
    apiToken = access_token;
    tokenExpiration = Date.now() + expires_in * 1000;
}

async function ensureToken() {
    if (!apiToken || Date.now() >= tokenExpiration) {
        await fetchToken();
    }
}

function parseForm(req) {
    const form = formidable({
        maxFileSize: 10 * 1024 * 1024,
        allowEmptyFiles: false,
        multiples: false,
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, _fields, files) => {
            if (err) return reject(err);
            resolve(files);
        });
    });
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const files = await parseForm(req);
        const uploaded = files.image;
        const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;

        if (!file) {
            return res.status(400).json({ error: "No image provided" });
        }

        const mime = file.mimetype || "";
        if (!/^image\/(png|jpeg|jpg)$/.test(mime)) {
            return res.status(400).json({
                error: "Only .png and .jpg images smaller than 10MB are supported",
            });
        }

        await ensureToken();

        const apiUrl = `${appConfig.API_BASE_URL}/inferences/${appConfig.AUDIENCE}/image`;

        const apiRes = await axios.post(apiUrl, fs.createReadStream(file.filepath), {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": mime,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true,
        });

        if (apiRes.status === 403) {
            return res
                .status(403)
                .json({ error: "This account lacks permission to analyze images" });
        }

        if (apiRes.status === 401) {
            apiToken = null;
            return res.status(401).json({ error: "Authentication failed" });
        }

        if (apiRes.status !== 200) {
            return res.status(apiRes.status).json({ error: "Failed to analyze image" });
        }

        const findings = apiRes.data?.data?.findings || [];

        if (!findings.length) {
            return res.status(200).json({
                lesionName: "I'm not sure what the condition of your skin is",
                therapyMessage:
                    "Just to be safe, get this checked out by a dermatologist.",
                lesion: null,
            });
        }

        const topFinding = findings.sort(
            (a, b) => b.confidence - a.confidence
        )[0];

        const lesionData = getLesionDataById(topFinding.id);

        return res.status(200).json({
            lesionName: lesionData.name,
            therapyMessage: lesionData.therapyMessage,
            lesion: { id: topFinding.id, name: lesionData.name },
            confidence: topFinding.confidence,
        });
    } catch (e) {
        console.error("analyze-image error:", e?.response?.data || e);
        return res.status(500).json({ error: "Failed to analyze image" });
    }
}
