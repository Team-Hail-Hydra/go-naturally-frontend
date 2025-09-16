// Team Section Components
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image: string;
  github: string;
  linkedin: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Kunal Shah",
    role: "Frontend Engineer",
    description: "",
    image: "/kunal.jpg",
    github: "https://github.com/kunalshah017",
    linkedin: "https://linkedin.com/in/kunalshah017",
  },
  {
    id: 2,
    name: "Rida Nakhuda",
    role: "UI/UX Designer",
    description: "",
    image: "/rida.jpg",
    github: "https://github.com/Rida-14",
    linkedin: "https://linkedin.com/in/rida-nakhuda-5b019728a/",
  },
  {
    id: 3,
    name: "Manali Deshpande",
    role: "UI/UX Designer",
    description: "",
    image: "/manali.jpg",
    github: "https://github.com/manalideshpande13",
    linkedin: "https://www.linkedin.com/in/manali-deshpande-87a5b037b/",
  },
  {
    id: 4,
    name: "Vinayak Patnaik",
    role: "Backend Engineer",
    description: "",
    image: "/vinayak.jpg",
    github: "https://github.com/Rageemon",
    linkedin: "https://www.linkedin.com/in/vinayak-patnaik-009503344/",
  },
  {
    id: 5,
    name: "Selva Perumal",
    role: "AI/ML Engineer",
    description: "",
    image: "/selva.jpg",
    github: "https://github.com/manuqlly",
    linkedin: "https://www.linkedin.com/in/selva-perumal-725a77216",
  },
  {
    id: 6,
    name: "Mohin Shaikh",
    role: "Backend Engineer",
    description: "",
    image: "/mohin.jpg",
    github: "https://github.com/MohinShaikh5689",
    linkedin: "https://www.linkedin.com/in/mohin-shaikh-26a75b285/",
  },
];
