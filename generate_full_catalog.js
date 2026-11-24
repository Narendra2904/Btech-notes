const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Standard friendly names for known subjects
const subjectTitles = {
  // Common / 1st Year
  "M1": "Mathematics - I",
  "M2": "Mathematics - II",
  "Maths1": "Mathematics - I",
  "Maths2": "Mathematics - II",
  "AP": "Applied Physics",
  "Physics": "Applied Physics",
  "PPS": "Programming for Problem Solving",
  "Workshop": "Engineering Workshop",
  "English": "English",
  "BEE": "Basic Electrical Engineering",
  "EC": "Engineering Chemistry",
  "EDC": "Electronic Devices & Circuits",
  "DS": "Data Structures",
  "DM": "Discrete Mathematics",
  "DLD": "Digital Logic Design",

  // CSE / IT / AIML / DS / Design
  "BEFA": "Business Economics & Financial Analysis",
  "CG": "Computer Graphics",
  "CN": "Computer Networks",
  "DAA": "Design and Analysis of Algorithms",
  "GT": "Graph Theory",
  "IDS": "Introduction to Data Science",
  "IP": "Image Processing",
  "ML": "Machine Learning",
  "WP": "Web Programming",
  "AI": "Artificial Intelligence",
  "IRS": "Information Retrieval Systems",
  "CVR": "Computer Vision and Robotics",
  "DWBI": "Data Warehouse & Business Intelligence",
  "NLP": "Natural Language Processing",
  "PR": "Pattern Recognition",
  "STM": "Software Testing Methodologies",
  "DL": "Deep Learning",
  "MC": "Mobile Computing",
  "NIC": "Nature Inspired Computing",
  "PPLE": "Principles of Programming Languages",
  "PPL": "Principles of Programming Languages",
  "SL": "Scripting Languages",
  "ASN": "Ad Hoc & Sensor Networks",
  "CC": "Cloud Computing",
  "ED": "Entrepreneurship Development",
  "CD": "Compiler Design",
  "CNS": "Cryptography & Network Security",
  "SPPM": "Software Process & Project Management",
  "UEE": "Utilization of Electrical Energy",
  "HCI": "Human Computer Interface",
  "OB": "Organisational Behaviour",
  "CT": "Communication Technologies",
  "ADA": "Advanced Data Structures & Algorithms",
  "ACD": "Advanced Compiler Design",
  "RSGIS": "Remote Sensing & GIS",
  "WSMA": "Web & Social Media Analytics",
  "DDB": "Distributed Databases",
  "DEV": "DevOps",
  "QC": "Quantum Computing",
  "FLAT": "Formal Languages & Automata Theory",
  "FSD": "Full Stack Development",
  "IOT": "Internet of Things",
  "MAD": "Mobile Application Development",
  "KRR": "Knowledge Representation & Reasoning",
  "PA": "Predictive Analytics",
  "BDA": "Big Data Analytics",
  "DVT": "Data Visualization Techniques",
  "FDS": "Foundations of Data Science",
  "RP": "R Programming",
  "DT": "Design Thinking",
  "ES": "Embedded Systems",
  "SM": "Software Modeling",
  "IED": "Industrial Engineering & Design",
  "SMD": "Social Media Data Analytics",
  "SPM": "Software Project Management",
  "ACA": "Advanced Computer Architecture",
  "DA": "Data Analytics",

  // CIVIL
  "HWRE": "Hydrology & Water Resources Engineering",
  "SA": "Structural Analysis",
  "SE1": "Structural Engineering - I",
  "SE2": "Structural Engineering - II",
  "TE": "Transportation Engineering",
  "EE": "Environmental Engineering",
  "FE": "Foundation Engineering",
  "GIT": "Geotechnical & Geoenvironmental Engineering",
  "PC": "Prestressed Concrete",
  "QSV": "Quantity Surveying & Valuation",
  "SE": "Software Engineering",
  "BMS": "Building Materials & Construction",
  "DPPM": "Disaster Preparedness & Planning Management",
  "EIA": "Environmental Impact Assessment",
  "GA": "Geographical Information Systems",
  "GBT": "Green Building Technologies",
  "SCPM": "Safety & Construction Project Management",
  "GWH": "Ground Water Hydrology",
  "PM": "Project Management",

  // MECH
  "CADCAM": "CAD/CAM",
  "DOM": "Dynamics of Machinery",
  "DOME": "Design of Machine Elements",
  "MMT": "Modern Machining Processes",
  "STJP": "Special Topics in Jet Propulsion",
  "BME": "Basic Mechanical Engineering",
  "FEM": "Finite Element Methods",
  "HT": "Heat Transfer",
  "Heat-Transfer": "Heat Transfer",
  "MD": "Machine Design",
  "MPA": "Manufacturing Process & Automation",
  "OR": "Operations Research",
  "PPC": "Production Planning & Control",
  "RES": "Renewable Energy Sources",
  "UMP": "Unconventional Machining Processes",
  "AIM": "Artificial Intelligence in Manufacturing",
  "AM": "Additive Manufacturing",
  "FPS": "Fluid Power Systems",
  "IM": "Industrial Management",
  "RAC": "Refrigeration & Air Conditioning",

  // EEE
  "CS": "Control Systems",
  "HVE": "High Voltage Engineering",
  "IOTA": "IoT Applications",
  "MPMC": "Microprocessors & Microcontrollers",
  "PE": "Power Electronics",
  "CPS": "Cyber Physical Systems",
  "DSP": "Digital Signal Processing",
  "FEV": "Fuel & Electric Vehicles",
  "PSD": "Power System Dynamics",
  "PSOC": "Power System Operation & Control",
  "PSP": "Power System Protection",
  "WSES": "Wind & Solar Energy Systems",
  "EHV": "Extra High Voltage AC Transmission",
  "FME": "Flexible Manufacturing Systems",
  "HVDC": "HVDC Transmission",
  "PEA": "Power Electronic Applications",

  // ECE
  "EMI": "Electronic Measurements & Instrumentation",
  "MWE": "Microwave Engineering",
  "OFC": "Optical Fiber Communications",
  "VLSI": "VLSI Design",
  "DIP": "Digital Image Processing",
  "WC": "Wireless Communications",
  "SC": "Satellite Communications",
  "CMC": "Cellular & Mobile Communications",
  "AWP": "Antennas & Wave Propagation",
  "AC": "Analog Communications",
  "DC": "Digital Communications",
  "PTSP": "Probability Theory & Stochastic Processes",
  "SS": "Signals & Systems",
  "ECA": "Electronic Circuit Analysis",
  "PDC": "Pulse & Digital Circuits",
  "LDIC": "Linear & Digital IC Applications",
  "STLD": "Switching Theory & Logic Design"
};

// Check if a file is an LFS pointer
function checkLfs(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < 500) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('git-lfs')) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

const catalog = {};

function scanDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDir(full);
    } else {
      const rel = path.relative(assetsDir, full).replace(/\\/g, '/');
      const parts = rel.split('/');
      if (parts.length < 4) continue;

      const branch = parts[0];
      const year = parseInt(parts[1].replace('year', ''), 10);
      const sem = parseInt(parts[2].replace('sem', ''), 10);
      const filename = parts.slice(3).join('/');

      if (!filename.endsWith('.pdf')) continue;

      if (!catalog[branch]) catalog[branch] = {};
      if (!catalog[branch][year]) catalog[branch][year] = {};
      if (!catalog[branch][year][sem]) catalog[branch][year][sem] = {};

      const semCatalog = catalog[branch][year][sem];
      const isLfs = checkLfs(full);

      // Patterns:
      const unitMatch = filename.match(/^(.+?)\s*-\s*[uU]nit\s*(\d+)\.pdf$/i);
      const sylMatch = filename.match(/^(.+?)[_\s]+Syl+abus\.pdf$/i);
      const fullMatch = filename.match(/^(.+?)[_\s]+Full\.pdf$/i);

      if (unitMatch) {
        const code = unitMatch[1].trim();
        const unitNum = parseInt(unitMatch[2], 10);
        if (!semCatalog[code]) {
          semCatalog[code] = {
            code,
            title: subjectTitles[code] || code,
            branch,
            year,
            sem,
            syllabus: null,
            fullNotes: null,
            units: []
          };
        }
        semCatalog[code].units.push({
          unit: unitNum,
          title: `Unit ${unitNum}`,
          filename,
          relPath: rel,
          isLfs
        });
      } else if (sylMatch) {
        const code = sylMatch[1].trim();
        if (!semCatalog[code]) {
          semCatalog[code] = {
            code,
            title: subjectTitles[code] || code,
            branch,
            year,
            sem,
            syllabus: null,
            fullNotes: null,
            units: []
          };
        }
        semCatalog[code].syllabus = {
          title: `${subjectTitles[code] || code} Syllabus`,
          filename,
          relPath: rel,
          isLfs
        };
      } else if (fullMatch) {
        const code = fullMatch[1].trim();
        if (!semCatalog[code]) {
          semCatalog[code] = {
            code,
            title: subjectTitles[code] || code,
            branch,
            year,
            sem,
            syllabus: null,
            fullNotes: null,
            units: []
          };
        }
        semCatalog[code].fullNotes = {
          title: `Complete Subject Notes`,
          filename,
          relPath: rel,
          isLfs
        };
      } else {
        const code = filename.replace(/\.pdf$/i, '').trim();
        if (!semCatalog[code]) {
          semCatalog[code] = {
            code,
            title: subjectTitles[code] || code,
            branch,
            year,
            sem,
            syllabus: null,
            fullNotes: null,
            units: []
          };
        }
        semCatalog[code].fullNotes = {
          title: `Complete Subject Notes`,
          filename,
          relPath: rel,
          isLfs
        };
      }
    }
  }
}

scanDir(assetsDir);

// Convert to structured object
const finalCatalog = {};
for (const [branch, years] of Object.entries(catalog)) {
  finalCatalog[branch] = {};
  for (const [year, sems] of Object.entries(years)) {
    finalCatalog[branch][year] = {};
    for (const [sem, subs] of Object.entries(sems)) {
      const list = Object.values(subs);
      list.forEach(s => {
        s.units.sort((a, b) => a.unit - b.unit);
      });
      list.sort((a, b) => a.title.localeCompare(b.title));
      finalCatalog[branch][year][sem] = list;
    }
  }
}

// For branches missing Year 1 (like CSE(AIML), CSE(DS), CSE(Design), ECE, EEE, MECH),
// map them to common Year 1 from CSE/CIV so students can access Year 1 notes directly!
const branchesToProvideYear1 = ['CSE(AIML)', 'CSE(DS)', 'CSE(Design)', 'ECE', 'EEE', 'MECH'];
for (const b of branchesToProvideYear1) {
  if (!finalCatalog[b]) finalCatalog[b] = {};
  if (!finalCatalog[b][1]) {
    finalCatalog[b][1] = {
      1: finalCatalog['CSE'][1][1] || [],
      2: finalCatalog['CSE'][1][2] || []
    };
  }
}

// Write catalog.js as client-ready and node-ready JS
const catalogJsContent = `// Auto-generated verified catalog of notes & syllabus
const NOTES_CATALOG = ${JSON.stringify(finalCatalog, null, 2)};

if (typeof window !== 'undefined') {
  window.NOTES_CATALOG = NOTES_CATALOG;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NOTES_CATALOG;
}
`;

fs.writeFileSync('catalog.js', catalogJsContent);
console.log('Successfully generated catalog.js!');
