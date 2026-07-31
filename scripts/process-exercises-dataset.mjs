import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../exercises-dataset/data/exercises.json'), 'utf8')
);

// Map Target / Body Part to InsaneFit Muscle Groups
const TARGET_TO_MUSCLE_GROUP = {
  'abs': 'Abdomen',
  'quads': 'Pernas',
  'hamstrings': 'Pernas',
  'adductors': 'Pernas',
  'abductors': 'Gluteos',
  'calves': 'Panturrilha',
  'glutes': 'Gluteos',
  'pectorals': 'Peito',
  'lats': 'Costas',
  'upper back': 'Costas',
  'spine': 'Lombar',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'delts': 'Ombros',
  'traps': 'Ombros',
  'forearms': 'Biceps',
  'cardiovascular system': 'Cardio',
  'serratus anterior': 'Abdomen',
  'levator scapulae': 'Ombros'
};

const BODY_PART_FALLBACK = {
  'waist': 'Abdomen',
  'upper legs': 'Pernas',
  'lower legs': 'Panturrilha',
  'back': 'Costas',
  'chest': 'Peito',
  'upper arms': 'Biceps',
  'shoulders': 'Ombros',
  'cardio': 'Cardio',
  'lower arms': 'Biceps',
  'neck': 'Ombros'
};

// Map Equipment to Portuguese
const EQUIPMENT_MAP = {
  'body weight': 'Peso Corporal',
  'cable': 'Cabos',
  'leverage machine': 'Maquina',
  'assisted': 'Maquina',
  'medicine ball': 'Medicine Ball',
  'stability ball': 'Bola Suica',
  'band': 'Elastico',
  'barbell': 'Barra',
  'rope': 'Cabos',
  'dumbbell': 'Halter',
  'ez barbell': 'Barra W',
  'sled machine': 'Maquina',
  'upper body ergometer': 'Maquina',
  'kettlebell': 'Kettlebell',
  'olympic barbell': 'Barra',
  'weighted': 'Peso',
  'bosu ball': 'Bosu',
  'resistance band': 'Elastico',
  'roller': 'Rolo',
  'skierg machine': 'SkiErg',
  'hammer': 'Halter',
  'smith machine': 'Smith',
  'wheel roller': 'Ab Wheel',
  'stationary bike': 'Bike',
  'tire': 'Funcional',
  'trap bar': 'Barra Trap',
  'elliptical machine': 'Eliptico',
  'stepmill machine': 'Escada'
};

// Sub-pattern dictionary for translation to Portuguese
const nameTranslations = [
  [/\bbench press\b/gi, 'Supino'],
  [/\bchest press\b/gi, 'Press de Peito'],
  [/\bincline\b/gi, 'Inclinado'],
  [/\bdecline\b/gi, 'Declinado'],
  [/\bpush-?up\b/gi, 'Flexao de Bracos'],
  [/\bpull-?up\b/gi, 'Barra Fixa'],
  [/\bchin-?up\b/gi, 'Barra Fixa Supinada'],
  [/\bsit-?up\b/gi, 'Abdominal'],
  [/\bcrunches?\b/gi, 'Crunch Abdominal'],
  [/\bdeadlift\b/gi, 'Levantamento Terra'],
  [/\bsquats?\b/gi, 'Agachamento'],
  [/\blunges?\b/gi, 'Avanco'],
  [/\brows?\b/gi, 'Remada'],
  [/\bcurls?\b/gi, 'Rosca'],
  [/\bextensions?\b/gi, 'Extensao'],
  [/\bflexions?\b/gi, 'Flexao'],
  [/\braises?\b/gi, 'Elevacao'],
  [/\bkickbacks?\b/gi, 'Coice'],
  [/\bbridges?\b/gi, 'Ponte'],
  [/\bplanks?\b/gi, 'Prancha'],
  [/\bbarbell\b/gi, 'Barra'],
  [/\bdumbbell\b/gi, 'Halter'],
  [/\bkettlebell\b/gi, 'Kettlebell'],
  [/\bcable\b/gi, 'Cabo'],
  [/\bmachine\b/gi, 'Maquina'],
  [/\bresistance band\b/gi, 'Elastico'],
  [/\bband\b/gi, 'Elastico'],
  [/\bbodyweight\b/gi, 'Peso Corporal'],
  [/\bseated\b/gi, 'Sentado'],
  [/\bstanding\b/gi, 'Em Pe'],
  [/\blying\b/gi, 'Deitado'],
  [/\bsingle arm\b/gi, 'Unilateral'],
  [/\bone arm\b/gi, 'Unilateral'],
  [/\balternating\b/gi, 'Alternado'],
  [/\breverse\b/gi, 'Invertido'],
  [/\boverhead\b/gi, 'Sobre a Cabeca'],
  [/\b lateral\b/gi, ' Lateral'],
  [/\b front\b/gi, ' Frontal'],
  [/\b rear\b/gi, ' Posterior']
];

function translateToPt(englishName) {
  let res = englishName;
  for (const [pattern, rep] of nameTranslations) {
    res = res.replace(pattern, rep);
  }
  return res.replace(/\s+/g, ' ').trim();
}

const processedExercises = rawData.map(item => {
  const muscleGroup = TARGET_TO_MUSCLE_GROUP[item.target] || BODY_PART_FALLBACK[item.body_part] || 'Funcional';
  const equipment = EQUIPMENT_MAP[item.equipment] || item.equipment;
  const category = ['barbell', 'dumbbell', 'body weight', 'squat', 'deadlift', 'press', 'row', 'pulldown', 'lunge'].some(k => item.name.toLowerCase().includes(k)) 
    ? 'Composto' 
    : 'Isolamento';

  const gifUrl = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${item.gif_url}`;
  const imageUrl = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${item.image}`;

  const displayName = translateToPt(item.name);

  return {
    id: `ds-${item.id}`,
    name: displayName,
    originalName: item.name,
    muscleGroup,
    category,
    equipment,
    difficulty: 'intermediate',
    source: 'dataset',
    target: item.target,
    gifUrl,
    imageUrl,
    instructionsEn: item.instruction_steps?.en || [],
    instructionsEs: item.instruction_steps?.es || []
  };
});

console.log(`Processed ${processedExercises.length} dataset exercises.`);

const outputFilePath = path.join(__dirname, '../src/data/generatedDatasetExercises.ts');
const fileContent = `// Auto-generated exercise dataset (1,324 items)
export interface DatasetExercise {
  id: string;
  name: string;
  originalName: string;
  muscleGroup: string;
  category: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: 'dataset';
  target: string;
  gifUrl: string;
  imageUrl: string;
  instructionsEn: string[];
  instructionsEs: string[];
}

export const generatedDatasetExercises: DatasetExercise[] = ${JSON.stringify(processedExercises, null, 2)};
`;

fs.writeFileSync(outputFilePath, fileContent, 'utf8');
console.log(`Successfully generated ${outputFilePath}`);

// Generate Supabase Seed SQL
const escapeSql = (str) => (str ? str.replace(/'/g, "''") : '');
const arrayToSql = (arr) => (arr && arr.length > 0 ? `ARRAY[${arr.map(s => `'${escapeSql(s)}'`).join(', ')}]` : 'ARRAY[]::text[]');

let sqlContent = `-- Seed para tabela global_exercises (1.324 exercicios)\n`;
sqlContent += `INSERT INTO global_exercises (id, name, original_name, muscle_group, category, equipment, target, image_url, gif_url, instructions_en, instructions_es)\nVALUES\n`;

const sqlRows = processedExercises.map(ex => {
  return `  ('${escapeSql(ex.id)}', '${escapeSql(ex.name)}', '${escapeSql(ex.originalName)}', '${escapeSql(ex.muscleGroup)}', '${escapeSql(ex.category)}', '${escapeSql(ex.equipment)}', '${escapeSql(ex.target)}', '${escapeSql(ex.imageUrl)}', '${escapeSql(ex.gifUrl)}', ${arrayToSql(ex.instructionsEn)}, ${arrayToSql(ex.instructionsEs)})`;
});

sqlContent += sqlRows.join(',\n');
sqlContent += `\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  muscle_group = EXCLUDED.muscle_group,\n  category = EXCLUDED.category,\n  equipment = EXCLUDED.equipment,\n  image_url = EXCLUDED.image_url,\n  gif_url = EXCLUDED.gif_url;\n`;

const sqlSeedPath = path.join(__dirname, '../supabase/seed_global_exercises.sql');
fs.writeFileSync(sqlSeedPath, sqlContent, 'utf8');
console.log(`Successfully generated Supabase seed SQL at ${sqlSeedPath}`);
