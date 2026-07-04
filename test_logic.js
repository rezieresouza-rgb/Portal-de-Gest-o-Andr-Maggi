const department = "Cozinha/Merenda";
const teamSchedules = {
  "2026-07-14": ["team1"],
  "2026-07-15": ["team1"],
  "2026-07-16": ["team1"],
  "2026-07-17": ["team1"],
  "2026-07-20": ["team1"]
};
const currentWorkingDays = ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-20"];
const dailyActivities = {};
const newDailyActivities = { ...dailyActivities };

const atividadesCozinha = [
  "Limpeza pesada da cozinha e despensa",
  "Organização do estoque de alimentos"
];

currentWorkingDays.forEach((day, index) => {
  if (!teamSchedules[day] || teamSchedules[day].length === 0) {
    newDailyActivities[day] = '';
    return;
  }
  let text = '';
  const includeCozinha = department === 'Todos' || department === 'Cozinha/Merenda';
  if (includeCozinha) {
    const coz = atividadesCozinha[index % atividadesCozinha.length];
    text += `COZINHA / MERENDA:\n- ${coz}\n\n`;
  }
  newDailyActivities[day] = text.trim();
});

console.log(newDailyActivities);
