// -----------------------------------------------------------------------------
// Grouped Body Locations mapping and display order
// -----------------------------------------------------------------------------

// Each findingId and its child IDs map to a condensed, top-level body location.
const BODY_LOCATION_MAP = {
    // Hair
    1201: "Hair",
    // Scalp
    1202: "Scalp", 23523: "Scalp", 23524: "Scalp", 23525: "Scalp", 23526: "Scalp", 23527: "Scalp", 23528: "Scalp",
    // Ear
    1208: "Ear", 23506: "Ear", 23507: "Ear", 23508: "Ear", 23509: "Ear", 23510: "Ear", 23537: "Ear", 23511: "Ear", 24887: "Ear",
    // Eye
    1268: "Eye", 1269: "Eye", 1205: "Eye", 23512: "Eye", 23513: "Eye",
    // Face
    1203: "Face", 1207: "Face", 1212: "Face", 1270: "Face", 1204: "Face", 23514: "Face", 23516: "Face", 1206: "Face", 24512: "Face", 23535: "Face",
    // Mouth
    1256: "Mouth", 23566: "Mouth", 23877: "Mouth", 23882: "Mouth", 23876: "Mouth", 23880: "Mouth", 23875: "Mouth",
    1264: "Mouth", 23881: "Mouth", 1266: "Mouth", 1257: "Mouth", 23878: "Mouth", 23522: "Mouth", 23879: "Mouth",
    // Lips
    1209: "Lips", 23515: "Lips", 1211: "Lips", 1210: "Lips",
    // Neck
    1213: "Neck", 1275: "Neck", 23532: "Neck", 1272: "Neck", 1276: "Neck", 1214: "Neck",
    // Shoulder
    23536: "Shoulder",
    // Trunk
    1226: "Trunk", 1231: "Trunk", 1232: "Trunk", 1234: "Trunk", 1236: "Trunk", 23529: "Trunk", 1235: "Trunk",
    1227: "Trunk", 1228: "Trunk", 1229: "Trunk", 23531: "Trunk", 1230: "Trunk", 23530: "Trunk",
    // Arm
    1216: "Arm", 1218: "Arm", 1217: "Arm", 23533: "Arm", 23534: "Arm", 1219: "Arm", 1215: "Arm",
    // Hands
    1220: "Hands", 1222: "Hands", 1224: "Hands", 24225: "Hands", 1274: "Hands", 24204: "Hands", 1221: "Hands", 1225: "Hands",
    // Fingernails
    1223: "Fingernails",
    // Anogenital
    24430: "Anogenital", 1237: "Anogenital", 1238: "Anogenital", 24346: "Anogenital", 22450: "Anogenital", 22452: "Anogenital",
    24347: "Anogenital", 22449: "Anogenital", 22451: "Anogenital", 22453: "Anogenital", 1245: "Anogenital", 1241: "Anogenital",
    1242: "Anogenital", 23809: "Anogenital", 23808: "Anogenital", 23518: "Anogenital", 23520: "Anogenital", 23519: "Anogenital",
    1243: "Anogenital", 1239: "Anogenital", 1240: "Anogenital", 1233: "Anogenital",
    // Leg
    1244: "Leg", 1249: "Leg", 1271: "Leg", 1248: "Leg", 23517: "Leg", 1247: "Leg", 1246: "Leg",
    // Foot or toes
    1250: "Foot or toes", 1252: "Foot or toes", 24513: "Foot or toes", 1251: "Foot or toes", 1253: "Foot or toes", 1273: "Foot or toes", 1254: "Foot or toes",
    // Toenails
    1255: "Toenails", 24188: "Toenails",
    // Close-up
    1267: "Close-up",
};

// Display order (top-to-bottom)
const BODY_ORDER = [
    "Hair",
    "Scalp",
    "Ear",
    "Eye",
    "Face",
    "Mouth",
    "Lips",
    "Neck",
    "Shoulder",
    "Trunk",
    "Arm",
    "Hands",
    "Fingernails",
    "Anogenital",
    "Leg",
    "Foot or toes",
    "Toenails",
    "Close-up",
];

// Export both
export { BODY_LOCATION_MAP, BODY_ORDER };
