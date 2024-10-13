var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const fs = require("fs").promises;
var usersRouter = require("./routes/users");
var dotenv = require("dotenv");
var OpenAI = require("openai");

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Serve static homepage
app.get("/", async (req, res) => {
  res.type("html");
  let fileContents = await fs.readFile("./views/home/index.html");
  res.send(fileContents);
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/users", usersRouter);

// Create the /sepsis-diagnosis endpoint for handling AI diagnosis
app.get("/sepsis-diagnosis", async (req, res) => {
  const question = req.query.question;

  // Simulate a sepsis knowledge graph (You can expand this or replace it with real data)
  const sepsisKnowledgeGraph = [
    "SOFA 0: Liver - Bilirubin < 20 μmol/L",
    "SOFA 0: Cardiovascular system - MAP ≥ 70 mmHg",
    "SOFA 0: Coagulation - Platelets ≥ 150 x 1000/μl",
    "SOFA 0: Respiratory system - PaO2/FiO2 ≥ 400 mmHg",
    "SOFA 0: Nervous system - Glasgow Coma Scale (GCS) = 15",
    "SOFA 0: Kidneys - Creatinine < 110 μmol/L",
    "SOFA 0: Kidneys - Urine output > 500 mL/day",

    "SOFA 1: Liver - Bilirubin 20-32 μmol/L",
    "SOFA 1: Cardiovascular system - MAP ≥ 70 mmHg (with vasopressors)",
    "SOFA 1: Coagulation - Platelets 100-150 x 1000/μl",
    "SOFA 1: Respiratory system - PaO2/FiO2 300-400 mmHg",
    "SOFA 1: Nervous system - GCS = 13-14",
    "SOFA 1: Kidneys - Creatinine 110-170 μmol/L",
    "SOFA 1: Kidneys - Urine output 200-500 mL/day",

    "SOFA 2: Liver - Bilirubin 33-101 μmol/L",
    "SOFA 2: Cardiovascular system - MAP < 70 mmHg",
    "SOFA 2: Cardiovascular system - Dopamine ≤ 5 µg/kg/min",
    "SOFA 2: Coagulation - Platelets 50-100 x 1000/μl",
    "SOFA 2: Respiratory system - PaO2/FiO2 200-300 mmHg",
    "SOFA 2: Nervous system - GCS = 10-12",
    "SOFA 2: Kidneys - Creatinine 171-299 μmol/L",
    "SOFA 2: Kidneys - Urine output < 200 mL/day",

    "SOFA 3: Liver - Bilirubin 102-204 μmol/L",
    "SOFA 3: Cardiovascular system - Dopamine > 5 µg/kg/min",
    "SOFA 3: Cardiovascular system - Epinephrine ≤ 0.1 µg/kg/min",
    "SOFA 3: Coagulation - Platelets 20-50 x 1000/μl",
    "SOFA 3: Respiratory system - PaO2/FiO2 100-200 mmHg",
    "SOFA 3: Nervous system - GCS = 6-9",
    "SOFA 3: Kidneys - Creatinine 300-440 μmol/L",

    "SOFA 4: Liver - Bilirubin > 204 μmol/L",
    "SOFA 4: Cardiovascular system - Dopamine > 15 µg/kg/min",
    "SOFA 4: Cardiovascular system - Epinephrine > 0.1 µg/kg/min",
    "SOFA 4: Coagulation - Platelets < 20 x 1000/μl",
    "SOFA 4: Respiratory system - PaO2/FiO2 < 100 mmHg",
    "SOFA 4: Nervous system - GCS < 6",
    "SOFA 4: Kidneys - Creatinine > 440 μmol/L",

    "Sepsis - Multi-organ dysfunction",
    "Sepsis - Liver failure",
    "Sepsis - Cardiovascular failure",
    "Sepsis - Coagulation dysfunction",
    "Sepsis - Respiratory failure",
    "Sepsis - Nervous system dysfunction",
    "Sepsis - Kidney failure",

    "Bilirubin < 20 μmol/L - Normal liver function",
    "Bilirubin 20-32 μmol/L - Mild liver dysfunction",
    "Bilirubin 33-101 μmol/L - Moderate liver dysfunction",
    "Bilirubin 102-204 μmol/L - Severe liver dysfunction",
    "Bilirubin > 204 μmol/L - Liver failure",

    "MAP ≥ 70 mmHg - Normal cardiovascular function",
    "MAP < 70 mmHg - Hypotension",
    "MAP ≥ 70 mmHg (with vasopressors) - Controlled hypotension",
    "Dopamine ≤ 5 µg/kg/min - Mild cardiovascular dysfunction",
    "Dopamine > 5 µg/kg/min - Moderate cardiovascular dysfunction",
    "Dopamine > 15 µg/kg/min - Severe cardiovascular dysfunction",
    "Epinephrine ≤ 0.1 µg/kg/min - Moderate support",
    "Epinephrine > 0.1 µg/kg/min - Severe support required",

    "Platelets ≥ 150 x 1000/μl - Normal clotting function",
    "Platelets 100-150 x 1000/μl - Mild clotting dysfunction",
    "Platelets 50-100 x 1000/μl - Moderate clotting dysfunction",
    "Platelets 20-50 x 1000/μl - Severe clotting dysfunction",
    "Platelets < 20 x 1000/μl - Very severe clotting dysfunction",

    "PaO2/FiO2 ≥ 400 mmHg - Normal respiratory function",
    "PaO2/FiO2 300-400 mmHg - Mild respiratory dysfunction",
    "PaO2/FiO2 200-300 mmHg - Moderate respiratory dysfunction",
    "PaO2/FiO2 100-200 mmHg - Severe respiratory dysfunction",
    "PaO2/FiO2 < 100 mmHg - Respiratory failure",

    "GCS = 15 - Normal neurological function",
    "GCS 13-14 - Mild neurological dysfunction",
    "GCS 10-12 - Moderate neurological dysfunction",
    "GCS 6-9 - Severe neurological dysfunction",
    "GCS < 6 - Neurological failure",

    "Creatinine < 110 μmol/L - Normal kidney function",
    "Creatinine 110-170 μmol/L - Mild kidney dysfunction",
    "Creatinine 171-299 μmol/L - Moderate kidney dysfunction",
    "Creatinine 300-440 μmol/L - Severe kidney dysfunction",
    "Creatinine > 440 μmol/L - Kidney failure",

    "Urine output > 500 mL/day - Normal kidney function",
    "Urine output 200-500 mL/day - Mild kidney dysfunction",
    "Urine output < 200 mL/day - Severe kidney dysfunction",

    "Sepsis - Acute organ failure",
    "Sepsis - Chronic organ failure",
    "Sepsis - Multi-organ failure",
    "Sepsis - Disseminated intravascular coagulation (DIC)",

    "Sepsis treatment - Mechanical ventilation",
    "Sepsis treatment - Hemodialysis",
    "Sepsis treatment - Vasopressors",
    "Sepsis treatment - Antibiotic therapy",
    "Sepsis treatment - Intravenous fluids",
    "Sepsis treatment - Source control surgery",
    "Sepsis treatment - Corticosteroids",
    "Sepsis treatment - Blood transfusion",
    "Sepsis treatment - Immunoglobulin therapy",

    "Sepsis complication - Septic shock",
    "Sepsis complication - Acute respiratory distress syndrome (ARDS)",
    "Sepsis complication - Acute kidney injury (AKI)",
    "Sepsis complication - Cardiac dysfunction",
    "Sepsis complication - Liver dysfunction",
    "Sepsis complication - Coagulopathy",
    "Sepsis complication - Gastrointestinal bleeding",
    "Sepsis complication - Neurological impairment",

    "Sepsis cardiovascular system - Hypotension",
    "Sepsis cardiovascular system - Hypertension",
    "Sepsis cardiovascular system - Tachycardia",
    "Sepsis cardiovascular system - Bradycardia",

    "Sepsis fluid management - Crystalloids",
    "Sepsis fluid management - Colloids",
    "Sepsis fluid management - Blood products",
    "Sepsis fluid management - Albumin",

    "Sepsis infection source - Pneumonia",
    "Sepsis infection source - Urinary tract infection (UTI)",
    "Sepsis infection source - Intra-abdominal infection",
    "Sepsis infection source - Skin infection",
    "Sepsis infection source - Bloodstream infection (bacteremia)",
    "Sepsis infection source - Endocarditis",
    "Sepsis infection source - Meningitis",
    "Sepsis infection source - Catheter-associated infection",

    "Sepsis hemodynamic monitoring - Central venous pressure (CVP)",
    "Sepsis hemodynamic monitoring - Pulmonary artery catheter",
    "Sepsis hemodynamic monitoring - Arterial blood pressure",
    "Sepsis hemodynamic monitoring - Cardiac output",
    "Sepsis hemodynamic monitoring - Stroke volume",

    "Sepsis lab finding - Elevated white blood cell count",
    "Sepsis lab finding - Decreased white blood cell count",
    "Sepsis lab finding - Increased lactate",
    "Sepsis lab finding - Low platelet count",
    "Sepsis lab finding - Elevated creatinine",
    "Sepsis lab finding - Increased procalcitonin",
    "Sepsis lab finding - Increased C-reactive protein (CRP)",
    "Sepsis lab finding - Elevated liver enzymes",
    "Sepsis lab finding - Hyperbilirubinemia",
    "Sepsis lab finding - Hypoalbuminemia",

    "Sepsis respiratory system - Hypoxemia",
    "Sepsis respiratory system - Hypercapnia",
    "Sepsis respiratory system - Mechanical ventilation support",
    "Sepsis respiratory system - High-flow oxygen",
    "Sepsis respiratory system - Intubation",

    "Sepsis coagulation - Increased D-dimer",
    "Sepsis coagulation - Decreased fibrinogen",
    "Sepsis coagulation - Prolonged prothrombin time (PT)",
    "Sepsis coagulation - Prolonged activated partial thromboplastin time (aPTT)",
    "Sepsis coagulation - Thrombocytopenia",

    "Sepsis neurological system - Delirium",
    "Sepsis neurological system - Coma",
    "Sepsis neurological system - Agitation",
    "Sepsis neurological system - Cognitive impairment",
    "Sepsis neurological system - Seizures",

    "Sepsis metabolic changes - Hyperglycemia",
    "Sepsis metabolic changes - Hypoglycemia",
    "Sepsis metabolic changes - Lactic acidosis",
    "Sepsis metabolic changes - Metabolic alkalosis",
    "Sepsis metabolic changes - Hyperkalemia",
    "Sepsis metabolic changes - Hypokalemia",

    "Sepsis kidney failure - Acute kidney injury (AKI)",
    "Sepsis kidney failure - Oliguria",
    "Sepsis kidney failure - Anuria",
    "Sepsis kidney failure - Elevated creatinine",
    "Sepsis kidney failure - Hemodialysis",

    "Sepsis gastrointestinal system - Paralytic ileus",
    "Sepsis gastrointestinal system - Gastrointestinal bleeding",
    "Sepsis gastrointestinal system - Elevated liver enzymes",
    "Sepsis gastrointestinal system - Abdominal pain",

    "Sepsis immune response - Cytokine storm",
    "Sepsis immune response - Immune suppression",
    "Sepsis immune response - Elevated interleukin-6 (IL-6)",
    "Sepsis immune response - Elevated tumor necrosis factor (TNF)",

    "Sepsis inflammatory marker - Procalcitonin",
    "Sepsis inflammatory marker - C-reactive protein (CRP)",
    "Sepsis inflammatory marker - Interleukin-6 (IL-6)",
    "Sepsis inflammatory marker - Tumor necrosis factor-alpha (TNF-alpha)",

    "Sepsis complication - Persistent infection",
    "Sepsis complication - Prolonged mechanical ventilation",
    "Sepsis complication - Muscle wasting",
    "Sepsis complication - Chronic fatigue",
    "Sepsis complication - Depression",
    "Sepsis complication - Post-sepsis syndrome",

    "Sepsis organ support - Renal replacement therapy",
    "Sepsis organ support - Mechanical ventilation",
    "Sepsis organ support - Vasopressor therapy",
    "Sepsis organ support - Extracorporeal membrane oxygenation (ECMO)",

    "Sepsis severity - Mild sepsis",
    "Sepsis severity - Severe sepsis",
    "Sepsis severity - Septic shock",
    "Sepsis severity - Refractory septic shock",

    "Sepsis diagnosis - Blood cultures",
    "Sepsis diagnosis - Urine cultures",
    "Sepsis diagnosis - Chest X-ray",
    "Sepsis diagnosis - CT scan",
    "Sepsis diagnosis - Ultrasound",

    "Sepsis organ impact - Brain dysfunction",
    "Sepsis organ impact - Myocardial dysfunction",
    "Sepsis organ impact - Hepatic failure",
    "Sepsis organ impact - Pulmonary failure",
    "Sepsis organ impact - Coagulopathy",

    "Sepsis microcirculatory change - Impaired perfusion",
    "Sepsis microcirculatory change - Capillary leakage",
    "Sepsis microcirculatory change - Hypoxia",
    "Sepsis microcirculatory change - Organ ischemia",

    "Sepsis immunology - Hyperinflammation",
    "Sepsis immunology - Immunosuppression",
    "Sepsis immunology - Innate immune response",
    "Sepsis immunology - Adaptive immune response",

    "Sepsis risk factor - Elderly population",
    "Sepsis risk factor - Immunocompromised individuals",
    "Sepsis risk factor - Diabetes mellitus",
    "Sepsis risk factor - Chronic kidney disease",
    "Sepsis risk factor - Chronic obstructive pulmonary disease (COPD)",

    "Sepsis pathophysiology - Endothelial activation",
    "Sepsis pathophysiology - Inflammatory cytokines",
    "Sepsis pathophysiology - Vasodilation",
    "Sepsis pathophysiology - Increased vascular permeability",
    "Sepsis pathophysiology - Coagulation cascade activation",

    "Septic shock - Refractory hypotension",
    "Septic shock - Multiorgan failure",
    "Septic shock - Tissue hypoperfusion",
    "Septic shock - Increased lactate",
    "Septic shock - Vasopressor dependence",

    "Fluid resuscitation - Early goal-directed therapy",
    "Fluid resuscitation - Balanced crystalloids",
    "Fluid resuscitation - Lactated Ringer's",
    "Fluid resuscitation - Normal saline",
    "Fluid resuscitation - Albumin",

    "Antibiotics - Broad-spectrum",
    "Antibiotics - Empiric therapy",
    "Antibiotics - Gram-positive coverage",
    "Antibiotics - Gram-negative coverage",
    "Antibiotics - Source-specific treatment",

    "Sepsis criteria - Quick Sequential Organ Failure Assessment (qSOFA)",
    "Sepsis criteria - SOFA score",
    "Sepsis criteria - SIRS criteria",
    "Sepsis criteria - Lactate > 2 mmol/L",
    "Sepsis criteria - Persistent hypotension",

    "Sepsis biomarker - Procalcitonin",
    "Sepsis biomarker - C-reactive protein (CRP)",
    "Sepsis biomarker - Interleukin-6 (IL-6)",
    "Sepsis biomarker - Tumor necrosis factor-alpha (TNF-alpha)",
    "Sepsis biomarker - D-dimer",

    "Sepsis in special population - Pediatric patients",
    "Sepsis in special population - Elderly patients",
    "Sepsis in special population - Pregnant women",
    "Sepsis in special population - Post-operative patients",
    "Sepsis in special population - Immunocompromised patients",

    "Sepsis respiratory dysfunction - Hypoxemia",
    "Sepsis respiratory dysfunction - Hypercapnia",
    "Sepsis respiratory dysfunction - Acute respiratory distress syndrome (ARDS)",
    "Sepsis respiratory dysfunction - Mechanical ventilation",
    "Sepsis respiratory dysfunction - Intubation",

    "Sepsis hemodynamic management - Fluid bolus",
    "Sepsis hemodynamic management - Vasopressors",
    "Sepsis hemodynamic management - Norepinephrine",
    "Sepsis hemodynamic management - Dopamine",
    "Sepsis hemodynamic management - Epinephrine",

    "Sepsis metabolic change - Lactic acidosis",
    "Sepsis metabolic change - Hyperglycemia",
    "Sepsis metabolic change - Hypoglycemia",
    "Sepsis metabolic change - Hypokalemia",
    "Sepsis metabolic change - Hyperkalemia",

    "Sepsis diagnostic tool - Blood cultures",
    "Sepsis diagnostic tool - Arterial blood gas (ABG)",
    "Sepsis diagnostic tool - Lactate level",
    "Sepsis diagnostic tool - Chest X-ray",
    "Sepsis diagnostic tool - Ultrasound",

    "Sepsis ICU management - Ventilator support",
    "Sepsis ICU management - Sedation",
    "Sepsis ICU management - Hemodialysis",
    "Sepsis ICU management - Vasopressor therapy",
    "Sepsis ICU management - Nutrition support",

    "Sepsis organ dysfunction - Acute kidney injury",
    "Sepsis organ dysfunction - Acute liver failure",
    "Sepsis organ dysfunction - Myocardial dysfunction",
    "Sepsis organ dysfunction - Respiratory failure",
    "Sepsis organ dysfunction - Coagulation disorder",

    "Long-term sepsis effect - Chronic fatigue",
    "Long-term sepsis effect - Cognitive impairment",
    "Long-term sepsis effect - Muscle wasting",
    "Long-term sepsis effect - Chronic pain",
    "Long-term sepsis effect - Post-traumatic stress disorder (PTSD)",

    "Sepsis mortality risk - High SOFA score",
    "Sepsis mortality risk - Septic shock",
    "Sepsis mortality risk - Multi-organ failure",
    "Sepsis mortality risk - Refractory hypotension",
    "Sepsis mortality risk - Immunosuppression",
  ];

  // Combine the user question with the knowledge context
  const context = sepsisKnowledgeGraph.join("\n");

  try {
    // Call the OpenAI API to get the AI's response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // You can change this to "gpt-3.5-turbo" or another model
      messages: [
        {
          role: "system",
          content: `You are a medical assistant trained to help doctors reduce diagnostic errors. Your role is to carefully analyze the symptoms, initial diagnosis, and patient data provided by the doctor and recommend actions that can help ensure the diagnosis is accurate. Fisrt, provide a percentage of how likely they the patient is diagnosed with Sepsis, in the format: "Sepsis Percentage: "
          Provide the doctor with advice on:

              1. Additional questions to ask the patient that could reveal overlooked symptoms or clarify the diagnosis.
              2. Recommended tests or imaging studies that should be conducted to confirm or rule out certain conditions.
              3. Any potential differential diagnoses that should be considered based on the symptoms.
              4. Guidance on monitoring the patient’s condition over time, including follow-up steps.

              For example, if a doctor suspects septic shock, suggest questions about the patient's recent infections, travel history, or immunocompromised state. Also, recommend laboratory tests like blood cultures, lactate level monitoring, and imaging if needed.

              Your goal is to ensure the doctor has all the relevant information to make the most accurate diagnosis and avoid errors.`,
        },
        {
          role: "user",
          content: `Question: ${question}\nContext: ${context}`,
        },
      ],
    });

    const responseMessage = completion.choices[0].message.content;

    // Return the AI-generated response to the frontend
    res.json({ response: responseMessage });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    res.status(500).json({ error: "Something went wrong with OpenAI." });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
