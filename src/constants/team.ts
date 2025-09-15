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
    role: "Frontend Developer",
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
    name: "Emma Rodriguez",
    role: "Backend Engineer",
    description:
      "Specializes in scalable systems and real-time data processing for environmental monitoring.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    github: "https://github.com/emmarodriguez",
    linkedin: "https://linkedin.com/in/emmarodriguez",
  },
  {
    id: 5,
    name: "David Kim",
    role: "Product Manager",
    description:
      "Bridging technology and environmental impact through strategic product development.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    github: "https://github.com/davidkim",
    linkedin: "https://linkedin.com/in/davidkim",
  },
  {
    id: 6,
    name: "Lisa Wang",
    role: "Data Scientist",
    description:
      "Analyzing environmental data to provide meaningful insights and predictions.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    github: "https://github.com/lisawang",
    linkedin: "https://linkedin.com/in/lisawang",
  },
];
