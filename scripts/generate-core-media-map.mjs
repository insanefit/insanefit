import { generatedDatasetExercises } from '../src/data/generatedDatasetExercises.ts';
import fs from 'node:fs';

const rawCoreExercises = [
  // PEITO
  { id: 'ex-001', name: 'Supino Reto (Barra)', search: 'barbell bench press' },
  { id: 'ex-002', name: 'Supino Inclinado (Barra)', search: 'barbell incline bench press' },
  { id: 'ex-003', name: 'Supino Declinado (Barra)', search: 'barbell decline bench press' },
  { id: 'ex-004', name: 'Supino Reto (Halter)', search: 'dumbbell bench press' },
  { id: 'ex-005', name: 'Supino Inclinado (Halter)', search: 'dumbbell incline bench press' },
  { id: 'ex-006', name: 'Crucifixo Reto (Halter)', search: 'dumbbell fly' },
  { id: 'ex-007', name: 'Crucifixo Inclinado', search: 'dumbbell incline fly' },
  { id: 'ex-008', name: 'Crucifixo Declinado', search: 'dumbbell decline fly' },
  { id: 'ex-009', name: 'Crossover (Cabos)', search: 'cable crossover' },
  { id: 'ex-010', name: 'Crossover Baixo', search: 'cable low fly' },
  { id: 'ex-011', name: 'Crossover Alto', search: 'cable decline fly' },
  { id: 'ex-012', name: 'Pullover (Halter)', search: 'dumbbell pullover' },
  { id: 'ex-013', name: 'Peck Deck', search: 'lever chest press' },
  { id: 'ex-014', name: 'Supino Fechado', search: 'barbell close grip bench press' },
  { id: 'ex-015', name: 'Mergulho (Paralelas)', search: 'chest dip' },
  { id: 'ex-016', name: 'Flexao de Bracos', search: 'push-up' },
  { id: 'ex-017', name: 'Flexao Diamante', search: 'diamond push-up' },

  // COSTAS
  { id: 'ex-101', name: 'Puxada Aberta (Pulldown)', search: 'lat pulldown' },
  { id: 'ex-102', name: 'Puxada Fechada (Triangulo)', search: 'v-bar lat pulldown' },
  { id: 'ex-103', name: 'Puxada com Pegada Supinada', search: 'underhand lat pulldown' },
  { id: 'ex-104', name: 'Remada Curvada (Barra)', search: 'barbell bent over row' },
  { id: 'ex-105', name: 'Remada Cavalinho', search: 't-bar row' },
  { id: 'ex-106', name: 'Remada Unilateral (Halter)', search: 'dumbbell row' },
  { id: 'ex-107', name: 'Remada Sentada (Cabos)', search: 'cable seated row' },
  { id: 'ex-108', name: 'Remada serrote', search: 'one arm dumbbell row' },
  { id: 'ex-109', name: 'Levantamento Terra (Barra)', search: 'barbell deadlift' },
  { id: 'ex-110', name: 'Barra Fixa (Pull-up)', search: 'pull-up' },
  { id: 'ex-111', name: 'Chin-up (Pegada Supinada)', search: 'chin-up' },
  { id: 'ex-112', name: 'Pullover na Maquina', search: 'lever pullover' },
  { id: 'ex-113', name: 'Remada Baixa (Cabos)', search: 'cable low seated row' },
  { id: 'ex-114', name: 'Face Pull (Cabos)', search: 'cable face pull' },
  { id: 'ex-115', name: 'Pullover com Cabo', search: 'cable straight arm pulldown' },
  { id: 'ex-116', name: 'Remada com Triangulo (Cabos)', search: 'cable seated high row' },

  // OMBROS
  { id: 'ex-201', name: 'Desenvolvimento Militar (Barra)', search: 'barbell standing military press' },
  { id: 'ex-202', name: 'Desenvolvimento Arnold (Halter)', search: 'arnold press' },
  { id: 'ex-203', name: 'Desenvolvimento com Halteres', search: 'dumbbell shoulder press' },
  { id: 'ex-204', name: 'Desenvolvimento na Maquina', search: 'lever shoulder press' },
  { id: 'ex-205', name: 'Desenvolvimento com Peso Corporal (Pike Push-up)', search: 'pike push-up' },
  { id: 'ex-206', name: 'Elevacao Lateral (Halter)', search: 'dumbbell lateral raise' },
  { id: 'ex-207', name: 'Elevacao Lateral na Maquina', search: 'lever lateral raise' },
  { id: 'ex-208', name: 'Elevacao Frontal (Halter)', search: 'dumbbell front raise' },
  { id: 'ex-209', name: 'Elevacao Frontal (Barra)', search: 'barbell front raise' },
  { id: 'ex-210', name: 'Crucifixo Invertido (Cabos)', search: 'cable rear delt fly' },
  { id: 'ex-211', name: 'Peck Deck Reverso', search: 'lever rear delt fly' },
  { id: 'ex-212', name: 'Encolhimento (Halter)', search: 'dumbbell shrug' },
  { id: 'ex-213', name: 'Encolhimento (Barra)', search: 'barbell shrug' },
  { id: 'ex-214', name: 'Encolhimento na Maquina', search: 'lever shrug' },
  { id: 'ex-215', name: 'Elevacao Lateral Inclinada', search: 'incline dumbbell lateral raise' },
  { id: 'ex-216', name: 'Clean and Press (Barra)', search: 'clean and press' },

  // BICEPS
  { id: 'ex-301', name: 'Rosca Direta (Barra)', search: 'barbell curl' },
  { id: 'ex-302', name: 'Rosca Alternada (Halter)', search: 'dumbbell alternate biceps curl' },
  { id: 'ex-303', name: 'Rosca Martelo (Halter)', search: 'dumbbell hammer curl' },
  { id: 'ex-304', name: 'Rosca Concentrada (Halter)', search: 'dumbbell concentration curl' },
  { id: 'ex-305', name: 'Rosca Scott (Barra W)', search: 'ez-bar preacher curl' },
  { id: 'ex-306', name: 'Rosca Scott (Halter)', search: 'dumbbell preacher curl' },
  { id: 'ex-307', name: 'Rosca Inclinada (Halter)', search: 'incline dumbbell curl' },
  { id: 'ex-308', name: 'Rosca na Polia Baixa (Barra)', search: 'cable curl' },
  { id: 'ex-309', name: 'Rosca na Polia Baixa (Cordas)', search: 'cable rope hammer curl' },
  { id: 'ex-310', name: 'Rosca 21', search: 'barbell 21' },
  { id: 'ex-311', name: 'Rosca Spider (Halter)', search: 'spider curl' },
  { id: 'ex-312', name: 'Rosca Inversa (Barra)', search: 'barbell reverse curl' },

  // TRICEPS
  { id: 'ex-401', name: 'Triceps Pulley (Barra Reta)', search: 'cable pushdown' },
  { id: 'ex-402', name: 'Triceps Pulley (Corda)', search: 'cable rope pushdown' },
  { id: 'ex-403', name: 'Triceps Testa (Barra W)', search: 'ez-bar skullcrusher' },
  { id: 'ex-404', name: 'Triceps Frances (Halter)', search: 'dumbbell triceps extension' },
  { id: 'ex-405', name: 'Triceps Coice (Halter)', search: 'dumbbell kickback' },
  { id: 'ex-406', name: 'Triceps Coice no Cabo', search: 'cable kickback' },
  { id: 'ex-407', name: 'Triceps Mergulho no Banco', search: 'bench dip' },
  { id: 'ex-408', name: 'Triceps na Maquina', search: 'lever triceps extension' },
  { id: 'ex-409', name: 'Triceps Frances na Polia', search: 'cable overhead triceps extension' },
  { id: 'ex-410', name: 'Triceps Unilateral no Cabo', search: 'cable one arm triceps extension' },

  // PERNAS
  { id: 'ex-501', name: 'Agachamento Livre (Barra)', search: 'barbell full squat' },
  { id: 'ex-502', name: 'Agachamento Hack', search: 'hack squat' },
  { id: 'ex-503', name: 'Agachamento Smith', search: 'smith squat' },
  { id: 'ex-504', name: 'Agachamento Sumo (Halter)', search: 'dumbbell sumo squat' },
  { id: 'ex-505', name: 'Agachamento Bulgaro (Halter)', search: 'dumbbell bulgarian split squat' },
  { id: 'ex-506', name: 'Leg Press 45', search: 'sled 45 degree leg press' },
  { id: 'ex-507', name: 'Leg Press Horizontal', search: 'horizontal leg press' },
  { id: 'ex-508', name: 'Cadeira Extensora', search: 'lever leg extension' },
  { id: 'ex-509', name: 'Mesa Flexora', search: 'lying leg curl' },
  { id: 'ex-510', name: 'Cadeira Flexora', search: 'seated leg curl' },
  { id: 'ex-511', name: 'Flexora Vertical Unilateral', search: 'standing leg curl' },
  { id: 'ex-512', name: 'Stiff (Barra)', search: 'barbell stiff leg deadlift' },
  { id: 'ex-513', name: 'Stiff (Halter)', search: 'dumbbell stiff leg deadlift' },
  { id: 'ex-514', name: 'Passada / Avanco (Halter)', search: 'dumbbell lunge' },
  { id: 'ex-515', name: 'Afundo (Halter)', search: 'dumbbell reverse lunge' },
  { id: 'ex-516', name: 'Cadeira Adutora', search: 'lever hip adduction' },

  // GLUTEOS
  { id: 'ex-601', name: 'Elevacao Pelvica (Barra)', search: 'barbell hip thrust' },
  { id: 'ex-602', name: 'Elevacao Pelvica na Maquina', search: 'lever hip thrust' },
  { id: 'ex-603', name: 'Cadeira Abdutora', search: 'lever hip abduction' },
  { id: 'ex-604', name: 'Coice de Gluteo na Polia', search: 'cable hip extension' },
  { id: 'ex-605', name: 'Coice de Gluteo na Maquina', search: 'lever hip extension' },
  { id: 'ex-606', name: 'Abducao de Quadril com Elastico', search: 'band hip abduction' },
  { id: 'ex-607', name: 'Gluteo Caneleira 4 Apoios', search: 'donkey kick' },

  // PANTURRILHA
  { id: 'ex-701', name: 'Gemeos em Pe (Maquina)', search: 'standing calf raise' },
  { id: 'ex-702', name: 'Gemeos Sentado (Maquina)', search: 'seated calf raise' },
  { id: 'ex-703', name: 'Panturrilha no Leg Press 45', search: 'sled calf press' },
  { id: 'ex-704', name: 'Panturrilha em Pe Unilateral', search: 'single leg calf raise' },
  { id: 'ex-705', name: 'Gemeos no Smith', search: 'smith calf raise' },

  // ABDOMEN
  { id: 'ex-801', name: 'Abdominal Supra (Solo)', search: 'crunch' },
  { id: 'ex-802', name: 'Abdominal Infra (Elevação de Pernas)', search: 'leg raise' },
  { id: 'ex-803', name: 'Abdominal Infra na Barra Fixa', search: 'hanging leg raise' },
  { id: 'ex-804', name: 'Abdominal Remador', search: 'v-up' },
  { id: 'ex-805', name: 'Prancha Frontal (Isometria)', search: 'plank' },
  { id: 'ex-806', name: 'Prancha Lateral', search: 'side plank' },
  { id: 'ex-807', name: 'Abdominal Obliquo (Cruzado)', search: 'cross crunch' },
  { id: 'ex-808', name: 'Abdominal na Polia (Rope Crunch)', search: 'cable crunch' },
  { id: 'ex-809', name: 'Abdominal na Maquina', search: 'lever crunch' },
  { id: 'ex-810', name: 'Roda Abdominal (Ab Wheel)', search: 'ab wheel roll out' },
  { id: 'ex-811', name: 'Russian Twist (Com Carga)', search: 'weighted russian twist' },

  // LOMBAR
  { id: 'ex-901', name: 'Hiperextensao Lombar', search: 'hyperextension' },
  { id: 'ex-902', name: 'Superman', search: 'superman' },
  { id: 'ex-903', name: 'Extensao Lombar (Maquina)', search: 'back extension machine' },
  { id: 'ex-904', name: 'Bird Dog', search: 'bird dog' },
  { id: 'ex-905', name: 'Ponte Lombar', search: 'glute bridge' },
  { id: 'ex-906', name: 'Levantamento Terra', search: 'deadlift' },

  // CARDIO
  { id: 'ex-1001', name: 'Esteira (Corrida)', search: 'treadmill running' },
  { id: 'ex-1002', name: 'Esteira (Caminhada Inclinada)', search: 'treadmill walking' },
  { id: 'ex-1003', name: 'Bicicleta Ergometrica', search: 'stationary bike' },
  { id: 'ex-1004', name: 'Bicicleta Air Bike', search: 'air bike' },
  { id: 'ex-1005', name: 'Elíptico', search: 'elliptical trainer' },
  { id: 'ex-1006', name: 'Remada (Concept 2)', search: 'rowing machine' },
  { id: 'ex-1007', name: 'Escada (StairMaster)', search: 'stairmaster' },
  { id: 'ex-1008', name: 'Jump Rope (Corda)', search: 'rope jumping' },
  { id: 'ex-1009', name: 'Burpees', search: 'burpee' },
  { id: 'ex-1010', name: 'Jumping Jacks', search: 'jumping jack' },
  { id: 'ex-1011', name: 'High Knees', search: 'high knees' },
  { id: 'ex-1012', name: 'Sprint (Corrida)', search: 'sprint' },
  { id: 'ex-1013', name: 'Escaladores (Stair Climber)', search: 'mountain climber' },
  { id: 'ex-1014', name: 'Ski Ergometer (Puxada Basica)', search: 'ski ergometer' },

  // FUNCIONAL / MOBILIDADE
  { id: 'ex-1101', name: 'Kettlebell Swing', search: 'kettlebell swing' },
  { id: 'ex-1102', name: 'Kettlebell Clean', search: 'kettlebell clean' },
  { id: 'ex-1103', name: 'Kettlebell Snatch', search: 'kettlebell snatch' },
  { id: 'ex-1104', name: 'Kettlebell Goblet Squat', search: 'kettlebell goblet squat' },
  { id: 'ex-1105', name: 'Kettlebell Turkish Get-up', search: 'turkish get-up' },
  { id: 'ex-1106', name: 'Medicine Ball Slam', search: 'medicine ball slam' },
  { id: 'ex-1107', name: 'Medicine Ball Wall Throw', search: 'wall ball' },
  { id: 'ex-1108', name: 'Battle Ropes', search: 'battle rope' },
  { id: 'ex-1109', name: 'Box Jump', search: 'box jump' },
  { id: 'ex-1110', name: 'TRX Row', search: 'suspension row' },
  { id: 'ex-1111', name: 'TRX Chest Press', search: 'suspension chest press' },
  { id: 'ex-1112', name: 'Sled Push', search: 'sled push' },
  { id: 'ex-1113', name: 'Sled Pull', search: 'sled pull' },
  { id: 'ex-1114', name: 'Farmer Walk', search: 'farmer walk' },
  { id: 'ex-1115', name: 'Wall Ball', search: 'wall ball' },
  { id: 'ex-1116', name: 'Prowler Push', search: 'prowler' },
];

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const usedIds = new Set();
const resultMap = {};

for (const item of rawCoreExercises) {
  const query = norm(item.search);
  const words = query.split(/\s+/);

  let bestMatch = generatedDatasetExercises.find(ds => {
    if (usedIds.has(ds.id)) return false;
    const orig = norm(ds.originalName);
    return orig === query;
  });

  if (!bestMatch) {
    bestMatch = generatedDatasetExercises.find(ds => {
      if (usedIds.has(ds.id)) return false;
      const orig = norm(ds.originalName);
      return words.every(w => orig.includes(w));
    });
  }

  if (!bestMatch) {
    bestMatch = generatedDatasetExercises.find(ds => {
      if (usedIds.has(ds.id)) return false;
      const name = norm(ds.name);
      return words.every(w => name.includes(w));
    });
  }

  if (!bestMatch && words.length > 1) {
    bestMatch = generatedDatasetExercises.find(ds => {
      if (usedIds.has(ds.id)) return false;
      const orig = norm(ds.originalName);
      return orig.includes(words[0]) && orig.includes(words[1]);
    });
  }

  if (!bestMatch) {
    bestMatch = generatedDatasetExercises.find(ds => !usedIds.has(ds.id));
  }

  if (bestMatch) {
    usedIds.add(bestMatch.id);
    resultMap[item.id] = {
      imageUrl: bestMatch.imageUrl,
      gifUrl: bestMatch.gifUrl,
      matchedName: bestMatch.name,
      matchedOrig: bestMatch.originalName
    };
  }
}

console.log(`Matched ${Object.keys(resultMap).length} core exercises to UNIQUE dataset GIFs!`);

const outputTs = `// Generated mapping for core exercise media
export const coreExerciseMediaById: Record<string, { imageUrl: string; gifUrl: string; matchedName?: string; matchedOrig?: string }> = ${JSON.stringify(resultMap, null, 2)};
`;

fs.writeFileSync('src/data/coreExerciseMediaMap.ts', outputTs);
console.log('Saved src/data/coreExerciseMediaMap.ts!');
