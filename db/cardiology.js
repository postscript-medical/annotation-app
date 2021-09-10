/**
 * Below is the listing used to create the Illustration entries in FaunaDB
 * 
 * And this is the query to build it using Fauna's shell:
 * 
 * Map(
  [...data],
  Lambda(
    "entry",
    Create(Collection("Illustration"), {
      data: {
        name: Select(["name"], Var("entry")),
        src: Select(["src"], Var("entry")),
        alias: Select(["alias"], Var("alias"))
      }
    })
  )
)
 */
export const data = [
  {
    name: "ICD",
    src: "icd.jpg",
    alias: [],
  },
  {
    name: "hypertrophic_cardiomyopathy",
    src: "hypertrophic_cardiomyopathy.jpg",
    alias: [],
  },
  {
    name: "heart_failure_reduced_ejection_fraction",
    src: "heart_failure_reduced_ejection_fraction.jpg",
    alias: [],
  },
  {
    name: "cardiac_resynchronisation_therapy",
    src: "cardiac_resynchronisation_therapy.jpg",
    alias: [],
  },
  {
    name: "heart_failure_preserved_ejection_fraction",
    src: "heart_failure_preserved_ejection_fraction.jpg",
    alias: [],
  },
  {
    name: "coronary_artery_bypass_graft",
    src: "coronary_artery_bypass_graft.jpg",
    alias: [],
  },
  {
    name: "coronary_artery_disease",
    src: "coronary_artery_disease.jpg",
    alias: [],
  },
  {
    name: "coronary_angiography_radial",
    src: "coronary_angiography_radial.jpg",
    alias: [],
  },
  {
    name: "coronary_angiography_femoral",
    src: "coronary_angiography_femoral.jpg",
    alias: [],
  },
  {
    name: "coronary_stent",
    src: "coronary_stent.jpg",
    alias: [],
  },
  {
    name: "tricuspid_stenosis",
    src: "tricuspid_stenosis.jpg",
    alias: [],
  },
  {
    name: "trans_catheter_mitral_valve_replacement",
    src: "trans_catheter_mitral_valve_replacement.jpg",
    alias: [],
  },
  {
    name: "trans_aortic_approach",
    src: "trans_aortic_approach.jpg",
    alias: [],
  },
  {
    name: "prosthetic_valves",
    src: "prosthetic_valves.jpg",
    alias: [],
  },
  {
    name: "tavr",
    src: "tavr.jpg",
    alias: [],
  },
  {
    name: "patent_foramen_ovale_closure",
    src: "patent_foramen_ovale_closure.jpg",
    alias: [],
  },
  {
    name: "new_ventricular_septal_defect",
    src: "new_ventricular_septal_defect.jpg",
    alias: [],
  },
  {
    name: "patent_foramen_ovale",
    src: "patent_foramen_ovale.jpg",
    alias: [],
  },
  {
    name: "mitral_regurgitation",
    src: "mitral_regurgitation.jpg",
    alias: [],
  },
  {
    name: "mitral_stenocis",
    src: "mitral_stenocis.jpg",
    alias: [],
  },
  {
    name: "aortic_stenosis",
    src: "aortic_stenosis.jpg",
    alias: [],
  },
  {
    name: "aortic_regurgitation",
    src: "aortic_regurgitation.jpg",
    alias: [],
  },
  {
    name: "infective_endocarditis",
    src: "infective_endocarditis.jpg",
    alias: [],
  },
  {
    name: "balloon_valvuloplasty",
    src: "balloon_valvuloplasty.jpg",
    alias: [],
  },
  {
    name: "mitral_clip",
    src: "mitral_clip.jpg",
    alias: [],
  },
  {
    name: "heat_valves",
    src: "heat_valves.jpg",
    alias: [],
  },
  {
    name: "bicuspid_aortic_valve",
    src: "bicuspid_aortic_valve.jpg",
    alias: [],
  },
];
