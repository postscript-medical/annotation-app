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
  { name: "Abdominal paracentesis", src: "abdominal_paracentesis.jpg" },
  { name: "Angiodysplasia", src: "angiodysplasia.jpg" },
  { name: "Bloating", src: "bloating.jpg" },
  { name: "Brain-gut microbiota axis", src: "brain_gut_microbiota_axis.jpg" },
  { name: "Cholangiocarcinoma", src: "cholangiocarcinoma.jpg" },
  { name: "Colonic function", src: "colonic_function.jpg" },
  { name: "Colonoscopy room", src: "colonoscopy_room.jpg" },
  { name: "Colonoscopy", src: "colonoscopy.jpg" },
  { name: "Defecatory dynamics", src: "defecatory_dynamics.jpg" },
  { name: "Endoscopy suite", src: "endoscopy_suite.jpg" },
  { name: "Ercp", src: "ercp.jpg" },
  { name: "Fistula", src: "fistula.jpg" },
  { name: "Gastric function", src: "gastric_function.jpg" },
  { name: "Gastro-oesophageal reflux", src: "gastro_oesophageal_reflux.jpg" },
  {
    name: "Gastrointestinal tract",
    src: "gastrointestinal_tract.jpg",
    default: true,
  },
  { name: "Graph", src: "graph.jpg" },
  { name: "Haemorrhoids", src: "haemorrhoids.jpg" },
  { name: "Hepatic encephalopathy", src: "hepatic_encephalopathy.jpg" },
  {
    name: "Hepato-pancreatico-biliary tract",
    src: "hepato_pancreatico_biliary_tract.jpg",
  },
  { name: "Hiatus hernia", src: "hiatus_hernia.jpg" },
  { name: "Ibd cross section", src: "ibd_cross_section.jpg" },
  {
    name: "Ileal pouch anal anastomosis",
    src: "ileal_pouch_anal_anastomosis.jpg",
  },
  { name: "Ileo-colonic resection", src: "ileo_colonic_resection.jpg" },
  { name: "Liver abscess drain", src: "liver_abscess_drain.jpg" },
  { name: "Liver biopsy", src: "liver_biopsy.jpg" },
  { name: "Liver cancer", src: "liver_cancer.jpg" },
  { name: "Liver disease stages", src: "liver_disease_stages.jpg" },
  { name: "Liver nutrition", src: "liver_nutrition.jpg" },
  { name: "Liver transplant", src: "liver_transplant.jpg" },
  { name: "Lumen", src: "lumen.jpg" },
  {
    name: "Oesophageal balloon dilatation",
    src: "oesophageal_balloon_dilatation.jpg",
  },
  { name: "Oesophageal stent", src: "oesophageal_stent.jpg" },
  { name: "Oesophagitis", src: "oesophagitis.jpg" },
  { name: "Pancreatic cancer", src: "pancreatic_cancer.jpg" },
  { name: "Pancreatitis", src: "pancreatitis.jpg" },
  { name: "Peptic ulcer disease", src: "peptic_ulcer_disease.jpg" },
  {
    name: "Percutaneous endoscopic gastrostomy",
    src: "percutaneous_endoscopic_gastrostomy.jpg",
  },
  { name: "Peri anal abscess", src: "peri_anal_abscess.jpg" },
  { name: "Polypectomy", src: "polypectomy.jpg" },
  { name: "Pouch stages", src: "pouch_stages.jpg" },
  { name: "Pouchitis", src: "pouchitis.jpg" },
  {
    name: "Primary sclerosing cholangitis",
    src: "primary_sclerosing_cholangitis.jpg",
  },
  { name: "Prolapse", src: "prolapse.jpg" },
  { name: "Rectocele", src: "rectocele.jpg" },
  { name: "Right hemi colectomy", src: "right_hemi_colectomy.jpg" },
  { name: "Sphincter function", src: "sphincter_function.jpg" },
  { name: "Stoma bag", src: "stoma_bag.jpg" },
  { name: "Stoma types", src: "stoma_types.jpg" },
  { name: "Stomas", src: "stomas.jpg" },
  { name: "Stricture dilatation", src: "stricture_dilatation.jpg" },
  { name: "Strictures", src: "strictures.jpg" },
  { name: "Stricturoplasty", src: "stricturoplasty.jpg" },
  { name: "Swallowing function", src: "swallowing_function.jpg" },
  { name: "Tipss", src: "tipss.jpg" },
  { name: "Tube feeding", src: "tube_feeding.jpg" },
  { name: "Ulcerative colitis extent", src: "ulcerative_colitis_extent.jpg" },
  { name: "Vagus nerve", src: "vagus_nerve.jpg" },
  { name: "Variceal band ligation", src: "variceal_band_ligation.jpg" },
  { name: "Varices", src: "varices.jpg" },
  { name: "Video capsule endoscopy", src: "video_capsule_endoscopy.jpg" },
  { name: "Visceral hypersensitivity", src: "visceral_hypersensitivity.jpg" },
];
