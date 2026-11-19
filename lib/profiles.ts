export type Profile = {
  id: number; name: string; age: number; photo: string; bio: string;
  location: string; interests: string[];
};

const names = [
  ["Aarav", "Sharma"], ["Ananya", "Mehta"], ["Kabir", "Kapoor"], ["Ishita", "Rao"],
  ["Reyansh", "Malhotra"], ["Kiara", "Khanna"], ["Aditya", "Verma"], ["Myra", "Singh"],
  ["Arjun", "Nair"], ["Sara", "Khan"], ["Vivaan", "Gupta"], ["Aisha", "Bose"],
  ["Rohan", "Das"], ["Tara", "Iyer"], ["Dev", "Chopra"], ["Meera", "Joshi"],
  ["Neil", "Bhatia"], ["Diya", "Saxena"], ["Yash", "Mishra"], ["Riya", "Menon"],
  ["Ibrahim", "Ali"], ["Avni", "Patel"], ["Krish", "Sethi"], ["Sana", "Thomas"],
  ["Dhruv", "Arora"], ["Naina", "Shah"], ["Manav", "Reddy"], ["Zoya", "Mirza"],
  ["Atharv", "Jain"], ["Pihu", "Chatterjee"], ["Samar", "Roy"], ["Aanya", "Kulkarni"]
];
const bios = [
  "Collecting little moments, big playlists, and stories worth retelling.",
  "Always up for spontaneous plans and really good coffee.",
  "Part-time overthinker, full-time sunset enthusiast.",
  "Here to meet kind people and find my next favorite place."
];
const places = ["Delhi University", "North Campus", "South Campus", "Gurugram", "Noida", "Hauz Khas", "Vasant Kunj", "Amity University"];
const interests = ["Coffee", "Photography", "Music", "Books", "Travel", "Movies", "Trekking", "Art", "Foodie", "Gaming", "Fitness", "Dogs"];

export const profiles: Profile[] = names.map(([first, last], i) => ({
  id: i + 1,
  name: `${first} ${last}`,
  age: 20 + (i % 6),
  photo: `https://images.unsplash.com/photo-${[
    "1534528741775-53994a69daeb","1500648767791-00dcc994a43e","1524504388940-b1c1722653e1",
    "1506794778202-cad84cf45f1d","1517841905240-472988babdf9","1506794778202-cad84cf45f1d"
  ][i % 6]}?auto=format&fit=crop&w=900&q=85`,
  bio: bios[i % bios.length],
  location: places[i % places.length],
  interests: [interests[i % interests.length], interests[(i + 3) % interests.length], interests[(i + 7) % interests.length]]
}));
