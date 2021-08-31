/**
 * Below is the listing used to create the Illustration entries in FaunaDB
 * 
 * And this is the query to build it using Fauna's shell:
 * 
 * q.Map(
  [...data],
  q.Lambda(
    "entry",
    q.Create(q.Collection("Illustration"), {
      data: {
        name: q.Select(["name"], q.Var("entry")),
        src: q.Select(["src"], q.Var("entry"))
      }
    })
  )
)
 */
export const data = [
  {
    name: "Abdominal paracentesis",
    src: "abdominal_paracentesis.jpg",
    alias: [],
  },
  { name: "Angiodysplasia", src: "angiodysplasia.jpg", alias: [] },
  { name: "Bloating", src: "bloating.jpg", alias: [] },
  {
    name: "Brain-gut microbiota axis",
    src: "brain_gut_microbiota_axis.jpg",
    alias: [],
  },
  { name: "Cholangiocarcinoma", src: "cholangiocarcinoma.jpg", alias: [] },
  { name: "Colonic function", src: "colonic_function.jpg", alias: [] },
  { name: "Colonoscopy room", src: "colonoscopy_room.jpg", alias: [] },
  { name: "Colonoscopy", src: "colonoscopy.jpg", alias: [] },
  { name: "Defecatory dynamics", src: "defecatory_dynamics.jpg", alias: [] },
  { name: "Endoscopy suite", src: "endoscopy_suite.jpg", alias: [] },
  { name: "Ercp", src: "ercp.jpg", alias: [] },
  { name: "Fistula", src: "fistula.jpg", alias: [] },
  { name: "Gastric function", src: "gastric_function.jpg", alias: [] },
  {
    name: "Gastro-oesophageal reflux",
    src: "gastro_oesophageal_reflux.jpg",
    alias: [],
  },
  {
    name: "Gastrointestinal tract",
    src: "gastrointestinal_tract.jpg",
    alias: [],
    default: true,
  },
  { name: "Graph", src: "graph.jpg", alias: [] },
  { name: "Haemorrhoids", src: "haemorrhoids.jpg", alias: [] },
  {
    name: "Hepatic encephalopathy",
    src: "hepatic_encephalopathy.jpg",
    alias: [],
  },
  {
    name: "Hepato-pancreatico-biliary tract",
    src: "hepato_pancreatico_biliary_tract.jpg",
    alias: [],
  },
  { name: "Hiatus hernia", src: "hiatus_hernia.jpg", alias: [] },
  { name: "Ibd cross section", src: "ibd_cross_section.jpg", alias: [] },
  {
    name: "Ileal pouch anal anastomosis",
    src: "ileal_pouch_anal_anastomosis.jpg",
    alias: [],
  },
  {
    name: "Ileo-colonic resection",
    src: "ileo_colonic_resection.jpg",
    alias: [],
  },
  { name: "Liver abscess drain", src: "liver_abscess_drain.jpg", alias: [] },
  { name: "Liver biopsy", src: "liver_biopsy.jpg", alias: [] },
  { name: "Liver cancer", src: "liver_cancer.jpg", alias: [] },
  { name: "Liver disease stages", src: "liver_disease_stages.jpg", alias: [] },
  { name: "Liver nutrition", src: "liver_nutrition.jpg", alias: [] },
  { name: "Liver transplant", src: "liver_transplant.jpg", alias: [] },
  { name: "Lumen", src: "lumen.jpg", alias: [] },
  {
    name: "Oesophageal balloon dilatation",
    src: "oesophageal_balloon_dilatation.jpg",
    alias: [],
  },
  { name: "Oesophageal stent", src: "oesophageal_stent.jpg", alias: [] },
  { name: "Oesophagitis", src: "oesophagitis.jpg", alias: [] },
  { name: "Pancreatic cancer", src: "pancreatic_cancer.jpg", alias: [] },
  { name: "Pancreatitis", src: "pancreatitis.jpg", alias: [] },
  { name: "Peptic ulcer disease", src: "peptic_ulcer_disease.jpg", alias: [] },
  {
    name: "Percutaneous endoscopic gastrostomy",
    src: "percutaneous_endoscopic_gastrostomy.jpg",
    alias: [],
  },
  { name: "Peri anal abscess", src: "peri_anal_abscess.jpg", alias: [] },
  { name: "Polypectomy", src: "polypectomy.jpg", alias: [] },
  { name: "Pouch stages", src: "pouch_stages.jpg", alias: [] },
  { name: "Pouchitis", src: "pouchitis.jpg", alias: [] },
  {
    name: "Primary sclerosing cholangitis",
    src: "primary_sclerosing_cholangitis.jpg",
    alias: [],
  },
  { name: "Prolapse", src: "prolapse.jpg", alias: [] },
  { name: "Rectocele", src: "rectocele.jpg", alias: [] },
  { name: "Right hemi colectomy", src: "right_hemi_colectomy.jpg", alias: [] },
  { name: "Sphincter function", src: "sphincter_function.jpg", alias: [] },
  { name: "Stoma bag", src: "stoma_bag.jpg", alias: [] },
  { name: "Stoma types", src: "stoma_types.jpg", alias: [] },
  { name: "Stomas", src: "stomas.jpg", alias: [] },
  { name: "Stricture dilatation", src: "stricture_dilatation.jpg", alias: [] },
  { name: "Strictures", src: "strictures.jpg", alias: [] },
  { name: "Stricturoplasty", src: "stricturoplasty.jpg", alias: [] },
  { name: "Swallowing function", src: "swallowing_function.jpg", alias: [] },
  { name: "Tipss", src: "tipss.jpg", alias: [] },
  { name: "Tube feeding", src: "tube_feeding.jpg", alias: [] },
  {
    name: "Ulcerative colitis extent",
    src: "ulcerative_colitis_extent.jpg",
    alias: [],
  },
  { name: "Vagus nerve", src: "vagus_nerve.jpg", alias: [] },
  {
    name: "Variceal band ligation",
    src: "variceal_band_ligation.jpg",
    alias: [],
  },
  { name: "Varices", src: "varices.jpg", alias: [] },
  {
    name: "Video capsule endoscopy",
    src: "video_capsule_endoscopy.jpg",
    alias: [],
  },
  {
    name: "Visceral hypersensitivity",
    src: "visceral_hypersensitivity.jpg",
    alias: [],
  },
];
