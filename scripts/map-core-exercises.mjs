import { generatedDatasetExercises } from '../src/data/generatedDatasetExercises.ts';

const coreExerciseNames = [
  // PEITO
  'Supino Reto (Barra)',
  'Supino Inclinado (Barra)',
  'Supino Declinado (Barra)',
  'Supino Reto (Halter)',
  'Supino Inclinado (Halter)',
  'Crucifixo Reto (Halter)',
  'Crucifixo Inclinado',
  'Crucifixo Declinado',
  'Crossover (Cabos)',
  'Crossover Baixo',
  'Crossover Alto',
  'Pullover (Halter)',
  'Peck Deck',
  'Supino Fechado',
  'Mergulho (Paralelas)',
  'Flexao de Bracos',
  'Flexao Diamante',

  // COSTAS
  'Puxada Aberta (Pulldown)',
  'Puxada Fechada (Triangulo)',
  'Puxada com Pegada Supinada',
  'Remada Curvada (Barra)',
  'Remada Cavalinho',
  'Remada Unilateral (Halter)',
  'Remada Sentada (Cabos)',
  'Remada serrote',
  'Levantamento Terra (Barra)',
  'Barra Fixa (Pull-up)',
  'Chin-up (Pegada Supinada)',
  'Pullover na Maquina',
  'Remada Baixa (Cabos)',
  'Face Pull (Cabos)',
  'Pullover com Cabo',
  'Remada com Triangulo (Cabos)',

  // OMBROS
  'Desenvolvimento Militar (Barra)',
  'Desenvolvimento Arnold (Halter)',
  'Desenvolvimento com Halteres',
  'Desenvolvimento na Maquina',
  'Desenvolvimento com Peso Corporal (Pike Push-up)',
  'Elevacao Lateral (Halter)',
  'Elevacao Lateral na Maquina',
  'Elevacao Frontal (Halter)',
  'Elevacao Frontal (Barra)',
  'Crucifixo Invertido (Cabos)',
  'Peck Deck Reverso',
  'Encolhimento (Halter)',
  'Encolhimento (Barra)',
  'Encolhimento na Maquina',
  'Elevacao Lateral Inclinada',
  'Clean and Press (Barra)',

  // BICEPS
  'Rosca Direta (Barra)',
  'Rosca Alternada (Halter)',
  'Rosca Martelo (Halter)',
  'Rosca Concentrada (Halter)',
  'Rosca Scott (Barra W)',
  'Rosca Scott (Halter)',
  'Rosca Inclinada (Halter)',
  'Rosca na Polia Baixa (Barra)',
  'Rosca na Polia Baixa (Cordas)',
  'Rosca 21',
  'Rosca Spider (Halter)',
  'Rosca Inversa (Barra)',

  // TRICEPS
  'Triceps Pulley (Barra Reta)',
  'Triceps Pulley (Corda)',
  'Triceps Testa (Barra W)',
  'Triceps Frances (Halter)',
  'Triceps Coice (Halter)',
  'Triceps Coice no Cabo',
  'Triceps Mergulho no Banco',
  'Triceps na Maquina',
  'Triceps Frances na Polia',
  'Triceps Unilateral no Cabo',

  // PERNAS
  'Agachamento Livre (Barra)',
  'Agachamento Hack',
  'Agachamento Smith',
  'Agachamento Sumo (Halter)',
  'Agachamento Bulgaro (Halter)',
  'Leg Press 45',
  'Leg Press Horizontal',
  'Cadeira Extensora',
  'Mesa Flexora',
  'Cadeira Flexora',
  'Flexora Vertical Unilateral',
  'Stiff (Barra)',
  'Stiff (Halter)',
  'Passada / Avanco (Halter)',
  'Afundo (Halter)',
  'Cadeira Adutora',

  // GLUTEOS
  'Elevacao Pelvica (Barra)',
  'Elevacao Pelvica na Maquina',
  'Cadeira Abdutora',
  'Coice de Gluteo na Polia',
  'Coice de Gluteo na Maquina',
  'Abducao de Quadril com Elastico',
  'Gluteo Caneleira 4 Apoios',

  // PANTURRILHA
  'Gemeos em Pe (Maquina)',
  'Gemeos Sentado (Maquina)',
  'Panturrilha no Leg Press 45',
  'Panturrilha em Pe Unilateral',
  'Gemeos no Smith',

  // ABDOMEN
  'Abdominal Supra (Solo)',
  'Abdominal Infra (Elevação de Pernas)',
  'Abdominal Infra na Barra Fixa',
  'Abdominal Remador',
  'Prancha Frontal (Isometria)',
  'Prancha Lateral',
  'Abdominal Obliquo (Cruzado)',
  'Abdominal na Polia (Rope Crunch)',
  'Abdominal na Maquina',
  'Roda Abdominal (Ab Wheel)',
  'Russian Twist (Com Carga)',

  // LOMBAR
  'Hiperextensao Lombar',
  'Superman',
  'Extensao Lombar (Maquina)',
  'Bird Dog',
  'Ponte Lombar',
  'Levantamento Terra',

  // CARDIO
  'Esteira (Corrida)',
  'Esteira (Caminhada Inclinada)',
  'Bicicleta Ergometrica',
  'Bicicleta Air Bike',
  'Elíptico',
  'Remada (Concept 2)',
  'Escada (StairMaster)',
  'Jump Rope (Corda)',
  'Burpees',
  'Jumping Jacks',
  'High Knees',
  'Sprint (Corrida)',
  'Escaladores (Stair Climber)',
  'Ski Ergometer (Puxada Basica)',

  // FUNCIONAL / MOBILIDADE
  'Kettlebell Swing',
  'Kettlebell Clean',
  'Kettlebell Snatch',
  'Kettlebell Goblet Squat',
  'Kettlebell Turkish Get-up',
  'Medicine Ball Slam',
  'Medicine Ball Wall Throw',
  'Battle Ropes',
  'Box Jump',
  'TRX Row',
  'TRX Chest Press',
  'Sled Push',
  'Sled Pull',
  'Farmer Walk',
  'Wall Ball',
  'Prowler Push',
];

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const mappings = {};
const usedDatasetIds = new Set();

for (const coreName of coreExerciseNames) {
  const cleanCore = norm(coreName.replace(/\([^)]*\)/g, ''));
  const words = cleanCore.split(/\s+/).filter(w => w.length > 2);

  let match = generatedDatasetExercises.find(ds => {
    if (usedDatasetIds.has(ds.id)) return false;
    const dsName = norm(ds.name);
    const dsOrig = norm(ds.originalName);
    return dsName === cleanCore || dsOrig === cleanCore;
  });

  if (!match) {
    match = generatedDatasetExercises.find(ds => {
      if (usedDatasetIds.has(ds.id)) return false;
      const dsName = norm(ds.name);
      const dsOrig = norm(ds.originalName);
      return words.every(w => dsName.includes(w) || dsOrig.includes(w));
    });
  }

  if (!match && words.length > 1) {
    match = generatedDatasetExercises.find(ds => {
      if (usedDatasetIds.has(ds.id)) return false;
      const dsName = norm(ds.name);
      return dsName.includes(words[0]) && dsName.includes(words[1]);
    });
  }

  if (!match && words.length > 0) {
    match = generatedDatasetExercises.find(ds => {
      if (usedDatasetIds.has(ds.id)) return false;
      const dsName = norm(ds.name);
      return dsName.includes(words[0]);
    });
  }

  if (match) {
    usedDatasetIds.add(match.id);
    mappings[coreName] = { id: match.id, name: match.name, orig: match.originalName, gif: match.gifUrl };
  } else {
    mappings[coreName] = null;
  }
}

console.log(JSON.stringify(mappings, null, 2));
