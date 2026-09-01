export type Profile = {
  id: number;
  name: string;
  aura: number;
  subject: string;
  color: string;
};

const teachers = [
  ["Frau Klein", 94, "Mathematik"], ["Herr Avery", 88, "Englisch"], ["Frau Berg", 91, "Biologie"], ["Herr Voss", 86, "Sport"],
  ["Herr Moss", 83, "Physik"], ["Frau Roth", 89, "Deutsch"], ["Herr Winter", 78, "Geschichte"], ["Frau Ray", 92, "Kunst"],
  ["Herr Martens", 87, "Informatik"], ["Frau Fischer", 85, "Chemie"], ["Herr Keller", 81, "Musik"], ["Frau Stern", 90, "Franzoesisch"],
  ["Herr Walter", 76, "Mathematik"], ["Frau Fox", 84, "Geografie"], ["Herr Brand", 93, "Politik"], ["Frau Kahn", 80, "Religion"],
  ["Herr Beck", 88, "Deutsch"], ["Frau Lenz", 95, "Englisch"], ["Herr Hart", 79, "Physik"], ["Frau Lake", 82, "Sport"],
  ["Herr Ford", 74, "Geschichte"], ["Frau Mohr", 90, "Biologie"], ["Herr Rex", 77, "Informatik"], ["Frau Meyer", 86, "Chemie"],
  ["Herr Wade", 89, "Musik"], ["Frau King", 83, "Mathematik"], ["Herr Stone", 92, "Kunst"], ["Frau Bloom", 87, "Deutsch"],
  ["Herr Wolf", 80, "Englisch"], ["Frau Vale", 85, "Geografie"], ["Herr Jones", 78, "Politik"], ["Frau Lux", 93, "Franzoesisch"],
  ["Herr Grant", 81, "Sport"], ["Frau Sage", 88, "Chemie"], ["Herr Nero", 75, "Physik"], ["Frau York", 91, "Mathematik"],
  ["Herr Ives", 84, "Informatik"], ["Frau Page", 79, "Musik"], ["Herr Shaw", 86, "Biologie"], ["Frau Cole", 90, "Kunst"],
] as const;

const colors = ["#ef6b58", "#f2c14e", "#5bc0be", "#8d7cf6", "#ee82a6", "#5d9cec", "#a4c96b", "#f28f3b"];

export const profiles: Profile[] = teachers.map(([name, aura, subject], index) => ({
  id: index + 1,
  name,
  aura,
  subject,
  color: colors[index % colors.length],
}));
