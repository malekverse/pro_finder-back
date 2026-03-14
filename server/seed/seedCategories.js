require("dotenv").config();

const mongoose = require("mongoose");

const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Service = require("../models/Service");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose.connect("mongodb+srv://rayen:Rayen123@cluster0.kwwp2ec.mongodb.net/pro_finder?appName=Cluster0");

const data = [
{
name: "Santé & Bien-être",
subcategories: [
{
name: "Médecine",
services: [
"Médecin généraliste",
"Cardiologue",
"Pédiatre",
"Gynécologue"
]
},
{
name: "Dentaire",
services: [
"Dentiste",
"Orthodontiste"
]
},
{
name: "Paramédical",
services: [
"Infirmier",
"Kinésithérapeute",
"Ostéopathe"
]
},
{
name: "Vétérinaire",
services: [
"Vétérinaire"
]
},
{
name: "Bien-être",
services: [
"Nutritionniste",
"Psychologue",
"Coach bien-être"
]
},
{
name: "Cliniques",
services: [
"Clinique médicale",
"Clinique dentaire"
]
},
{
name: "Laboratoires",
services: [
"Laboratoire d’analyses"
]
},
{
name: "Pharmacie",
services: [
"Pharmacie",
"Parapharmacie"
]
}
]
},

{
name: "Maison & Dépannage",
subcategories: [
{
name: "Bâtiment",
services: [
"Plombier",
"Électricien",
"Maçon",
"Peintre"
]
},
{
name: "Climatisation",
services: [
"Technicien climatisation",
"Chauffagiste"
]
},
{
name: "Menuiserie",
services: [
"Menuisier bois",
"Menuisier aluminium"
]
},
{
name: "Nettoyage",
services: [
"Agent de nettoyage",
"Femme de ménage"
]
}
]
},

{
name: "Automobile & Transport",
subcategories: [
{
name: "Réparation auto",
services: [
"Mécanicien",
"Électricien auto"
]
},
{
name: "Entretien",
services: [
"Lavage auto",
"Carrossier"
]
},
{
name: "Transport",
services: [
"Chauffeur privé",
"Taxi"
]
}
]
},

{
name: "Business & Juridique",
subcategories: [
{
name: "Comptabilité",
services: [
"Comptable",
"Expert-comptable"
]
},
{
name: "Juridique",
services: [
"Avocat",
"Conseiller juridique"
]
},
{
name: "Conseil",
services: [
"Consultant business",
"Coach carrière"
]
}
]
},

{
name: "Technologie & Digital",
subcategories: [
{
name: "Développement",
services: [
"Développeur web",
"Développeur mobile",
"Full-stack"
]
},
{
name: "IT",
services: [
"Technicien réseau",
"Support IT"
]
},
{
name: "Digital marketing",
services: [
"Community manager",
"SEO",
"SEA"
]
}
]
},

{
name: "Éducation & Formation",
subcategories: [
{
name: "Scolaire",
services: [
"Professeur particulier"
]
},
{
name: "Professionnelle",
services: [
"Formateur",
"Coach professionnel"
]
}
]
},

{
name: "Créatif & Médias",
subcategories: [
{
name: "Design",
services: [
"Graphiste",
"UX/UI Designer"
]
},
{
name: "Audiovisuel",
services: [
"Photographe",
"Vidéaste"
]
},
{
name: "Rédaction",
services: [
"Rédacteur web",
"Copywriter"
]
}
]
},

{
name: "Services personnels",
subcategories: [
{
name: "Événementiel",
services: [
"Organisateur événement"
]
},
{
name: "Beauté",
services: [
"Coiffeur",
"Esthéticienne",
"Maquilleur"
]
}
]
}
];

async function seed() {

await Category.deleteMany();
await SubCategory.deleteMany();
await Service.deleteMany();

for (const cat of data) {

const category = await Category.create({ name: cat.name });

for (const sub of cat.subcategories) {

const subcategory = await SubCategory.create({
name: sub.name,
category_id: category._id
});

for (const service of sub.services) {

await Service.create({
name: service,
subcategory_id: subcategory._id
});

}

}

}

console.log("Categories seeded !");
mongoose.disconnect();

}

seed();