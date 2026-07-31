import { generatedDatasetExercises } from './generatedDatasetExercises';
export type { DatasetExercise } from './generatedDatasetExercises';

export interface LibraryExercise {
  id: string;
  name: string;
  originalName?: string;
  muscleGroup: string;
  category: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source?: 'core' | 'animatic' | 'dataset';
  target?: string;
  gifUrl?: string;
  imageUrl?: string;
  instructionsEn?: string[];
  instructionsEs?: string[];
}

export const muscleGroups = [
  'Peito',
  'Costas',
  'Ombros',
  'Biceps',
  'Triceps',
  'Pernas',
  'Gluteos',
  'Panturrilha',
  'Abdomen',
  'Lombar',
  'Cardio',
  'Funcional',
] as const;

const normalizeKey = (val: string) =>
  val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

const rawCoreExercises: LibraryExercise[] = [
  // PEITO
  { id: 'ex-001', name: 'Supino Reto (Barra)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-002', name: 'Supino Inclinado (Barra)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-003', name: 'Supino Declinado (Barra)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-004', name: 'Supino Reto (Halter)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-005', name: 'Supino Inclinado (Halter)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-006', name: 'Crucifixo Reto (Halter)', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-007', name: 'Crucifixo Inclinado', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-008', name: 'Crucifixo Declinado', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-009', name: 'Crossover (Cabos)', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-010', name: 'Crossover Baixo', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-011', name: 'Crossover Alto', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-012', name: 'Pullover (Halter)', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-013', name: 'Peck Deck', muscleGroup: 'Peito', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-014', name: 'Supino Fechado', muscleGroup: 'Peito', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-015', name: 'Mergulho (Paralelas)', muscleGroup: 'Peito', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-016', name: 'Flexao de Bracos', muscleGroup: 'Peito', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-017', name: 'Flexao Diamante', muscleGroup: 'Peito', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'intermediate' },

  // COSTAS
  { id: 'ex-101', name: 'Puxada Aberta (Pulldown)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-102', name: 'Puxada Fechada (Triangulo)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-103', name: 'Puxada com Pegada Supinada', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'intermediate' },
  { id: 'ex-104', name: 'Remada Curvada (Barra)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-105', name: 'Remada Cavalinho', muscleGroup: 'Costas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-106', name: 'Remada Unilateral (Halter)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-107', name: 'Remada Sentada (Cabos)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-108', name: 'Remada serrote', muscleGroup: 'Costas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-109', name: 'Levantamento Terra (Barra)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Barra', difficulty: 'advanced' },
  { id: 'ex-110', name: 'Barra Fixa (Pull-up)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-111', name: 'Chin-up (Pegada Supinada)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-112', name: 'Pullover na Maquina', muscleGroup: 'Costas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-113', name: 'Remada Baixa (Cabos)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-114', name: 'Face Pull (Cabos)', muscleGroup: 'Costas', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-115', name: 'Pullover com Cabo', muscleGroup: 'Costas', category: 'Isolamento', equipment: 'Cabos', difficulty: 'intermediate' },
  { id: 'ex-116', name: 'Remada com Triangulo (Cabos)', muscleGroup: 'Costas', category: 'Composto', equipment: 'Cabos', difficulty: 'beginner' },

  // OMBROS
  { id: 'ex-201', name: 'Desenvolvimento Militar (Barra)', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-202', name: 'Desenvolvimento Arnold (Halter)', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-203', name: 'Desenvolvimento com Halteres', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-204', name: 'Desenvolvimento na Maquina', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-205', name: 'Desenvolvimento com Peso Corporal (Pike Push-up)', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-206', name: 'Elevacao Lateral (Halter)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-207', name: 'Elevacao Lateral na Maquina', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-208', name: 'Elevacao Frontal (Halter)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-209', name: 'Elevacao Frontal (Barra)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-210', name: 'Crucifixo Invertido (Cabos)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-211', name: 'Peck Deck Reverso', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-212', name: 'Encolhimento (Halter)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-213', name: 'Encolhimento (Barra)', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-214', name: 'Encolhimento na Maquina', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-215', name: 'Elevacao Lateral Inclinada', muscleGroup: 'Ombros', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-216', name: 'Clean and Press (Barra)', muscleGroup: 'Ombros', category: 'Composto', equipment: 'Barra', difficulty: 'advanced' },

  // BICEPS
  { id: 'ex-301', name: 'Rosca Direta (Barra)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-302', name: 'Rosca Alternada (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-303', name: 'Rosca Martelo (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-304', name: 'Rosca Concentrada (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-305', name: 'Rosca Scott (Barra W)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-306', name: 'Rosca Scott (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-307', name: 'Rosca Inclinada (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-308', name: 'Rosca na Polia Baixa (Barra)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-309', name: 'Rosca na Polia Baixa (Cordas)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-310', name: 'Rosca 21', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-311', name: 'Rosca Spider (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-312', name: 'Rosca Inversa (Barra)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },

  // TRICEPS
  { id: 'ex-401', name: 'Triceps Pulley (Barra Reta)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-402', name: 'Triceps Pulley (Corda)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-403', name: 'Triceps Testa (Barra W)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-404', name: 'Triceps Frances (Halter)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-405', name: 'Triceps Coice (Halter)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-406', name: 'Triceps Coice no Cabo', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-407', name: 'Triceps Mergulho no Banco', muscleGroup: 'Triceps', category: 'Composto', equipment: 'Banco', difficulty: 'beginner' },
  { id: 'ex-408', name: 'Triceps na Maquina', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-409', name: 'Triceps Frances na Polia', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'intermediate' },
  { id: 'ex-410', name: 'Triceps Unilateral no Cabo', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },

  // PERNAS
  { id: 'ex-501', name: 'Agachamento Livre (Barra)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-502', name: 'Agachamento Hack', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-503', name: 'Agachamento Smith', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Smith', difficulty: 'beginner' },
  { id: 'ex-504', name: 'Agachamento Sumo (Halter)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-505', name: 'Agachamento Bulgaro (Halter)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-506', name: 'Leg Press 45', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-507', name: 'Leg Press Horizontal', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-508', name: 'Cadeira Extensora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-509', name: 'Mesa Flexora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-510', name: 'Cadeira Flexora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-511', name: 'Flexora Vertical Unilateral', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-512', name: 'Stiff (Barra)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-513', name: 'Stiff (Halter)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-514', name: 'Passada / Avanco (Halter)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-515', name: 'Afundo (Halter)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-516', name: 'Cadeira Adutora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },

  // GLUTEOS
  { id: 'ex-601', name: 'Elevacao Pelvica (Barra)', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-602', name: 'Elevacao Pelvica na Maquina', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-603', name: 'Cadeira Abdutora', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-604', name: 'Coice de Gluteo na Polia', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-605', name: 'Coice de Gluteo na Maquina', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-606', name: 'Abducao de Quadril com Elastico', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Elastico', difficulty: 'beginner' },
  { id: 'ex-607', name: 'Gluteo Caneleira 4 Apoios', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Caneleira', difficulty: 'beginner' },

  // PANTURRILHA
  { id: 'ex-701', name: 'Gemeos em Pe (Maquina)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-702', name: 'Gemeos Sentado (Maquina)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-703', name: 'Panturrilha no Leg Press 45', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-704', name: 'Panturrilha em Pe Unilateral', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-705', name: 'Gemeos no Smith', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Smith', difficulty: 'beginner' },

  // ABDOMEN
  { id: 'ex-801', name: 'Abdominal Supra (Solo)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-802', name: 'Abdominal Infra (Elevação de Pernas)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-803', name: 'Abdominal Infra na Barra Fixa', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-804', name: 'Abdominal Remador', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-805', name: 'Prancha Frontal (Isometria)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-806', name: 'Prancha Lateral', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-807', name: 'Abdominal Obliquo (Cruzado)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-808', name: 'Abdominal na Polia (Rope Crunch)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-809', name: 'Abdominal na Maquina', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-810', name: 'Roda Abdominal (Ab Wheel)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Roda Abdominal', difficulty: 'intermediate' },
  { id: 'ex-811', name: 'Russian Twist (Com Carga)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },

  // LOMBAR
  { id: 'ex-901', name: 'Hiperextensao Lombar', muscleGroup: 'Lombar', category: 'Isolamento', equipment: 'Banco 45', difficulty: 'beginner' },
  { id: 'ex-902', name: 'Superman', muscleGroup: 'Lombar', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-903', name: 'Extensao Lombar (Maquina)', muscleGroup: 'Lombar', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-904', name: 'Bird Dog', muscleGroup: 'Lombar', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-905', name: 'Ponte Lombar', muscleGroup: 'Lombar', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-906', name: 'Levantamento Terra', muscleGroup: 'Lombar', category: 'Composto', equipment: 'Barra', difficulty: 'advanced' },

  // CARDIO
  { id: 'ex-1001', name: 'Esteira (Corrida)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Esteira', difficulty: 'beginner' },
  { id: 'ex-1002', name: 'Esteira (Caminhada Inclinada)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Esteira', difficulty: 'beginner' },
  { id: 'ex-1003', name: 'Bicicleta Ergometrica', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Bike', difficulty: 'beginner' },
  { id: 'ex-1004', name: 'Bicicleta Air Bike', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Bike', difficulty: 'intermediate' },
  { id: 'ex-1005', name: 'Elíptico', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Elíptico', difficulty: 'beginner' },
  { id: 'ex-1006', name: 'Remada (Concept 2)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Remo', difficulty: 'intermediate' },
  { id: 'ex-1007', name: 'Escada (StairMaster)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Escada', difficulty: 'intermediate' },
  { id: 'ex-1008', name: 'Jump Rope (Corda)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Corda', difficulty: 'beginner' },
  { id: 'ex-1009', name: 'Burpees', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-1010', name: 'Jumping Jacks', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-1011', name: 'High Knees', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-1012', name: 'Sprint (Corrida)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-1013', name: 'Escaladores (Stair Climber)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-1014', name: 'Ski Ergometer (Puxada Basica)', muscleGroup: 'Cardio', category: 'Cardio', equipment: 'SkiErg', difficulty: 'beginner' },

  // FUNCIONAL / MOBILIDADE
  { id: 'ex-1101', name: 'Kettlebell Swing', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Kettlebell', difficulty: 'intermediate' },
  { id: 'ex-1102', name: 'Kettlebell Clean', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Kettlebell', difficulty: 'advanced' },
  { id: 'ex-1103', name: 'Kettlebell Snatch', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Kettlebell', difficulty: 'advanced' },
  { id: 'ex-1104', name: 'Kettlebell Goblet Squat', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Kettlebell', difficulty: 'beginner' },
  { id: 'ex-1105', name: 'Kettlebell Turkish Get-up', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Kettlebell', difficulty: 'advanced' },
  { id: 'ex-1106', name: 'Medicine Ball Slam', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Medicine Ball', difficulty: 'beginner' },
  { id: 'ex-1107', name: 'Medicine Ball Wall Throw', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Medicine Ball', difficulty: 'beginner' },
  { id: 'ex-1108', name: 'Battle Ropes', muscleGroup: 'Funcional', category: 'Cardio', equipment: 'Cordas', difficulty: 'intermediate' },
  { id: 'ex-1109', name: 'Box Jump', muscleGroup: 'Funcional', category: 'Pliometrico', equipment: 'Caixote', difficulty: 'intermediate' },
  { id: 'ex-1110', name: 'TRX Row', muscleGroup: 'Funcional', category: 'Composto', equipment: 'TRX', difficulty: 'beginner' },
  { id: 'ex-1111', name: 'TRX Chest Press', muscleGroup: 'Funcional', category: 'Composto', equipment: 'TRX', difficulty: 'beginner' },
  { id: 'ex-1112', name: 'Sled Push', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Trenó', difficulty: 'intermediate' },
  { id: 'ex-1113', name: 'Sled Pull', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Trenó', difficulty: 'intermediate' },
  { id: 'ex-1114', name: 'Farmer Walk', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-1115', name: 'Wall Ball', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Medicine Ball', difficulty: 'beginner' },
  { id: 'ex-1116', name: 'Prowler Push', muscleGroup: 'Funcional', category: 'Composto', equipment: 'Prowler', difficulty: 'advanced' },
];

export const coreExercises: LibraryExercise[] = rawCoreExercises.map((exercise) => {
  const cleanName = exercise.name.replace(/\([^)]*\)/g, '').trim()
  const cleanKey = normalizeKey(cleanName)

  const match = (generatedDatasetExercises as LibraryExercise[]).find((ds) => {
    const dsKey = normalizeKey(ds.name)
    const dsOrig = normalizeKey(ds.originalName ?? '')
    return dsKey.includes(cleanKey) || cleanKey.includes(dsKey) || dsOrig.includes(cleanKey)
  }) ?? (generatedDatasetExercises as LibraryExercise[]).find((ds) => ds.muscleGroup === exercise.muscleGroup)

  return {
    ...exercise,
    source: 'core',
    imageUrl: exercise.imageUrl || match?.imageUrl,
    gifUrl: exercise.gifUrl || match?.gifUrl,
  }
});

export const exerciseLibrary: LibraryExercise[] = [
  ...coreExercises,
  ...(generatedDatasetExercises as LibraryExercise[]),
];

export const getExercisesByMuscleGroup = (group: string) =>
  exerciseLibrary.filter((e) => e.muscleGroup === group);

export const searchExercises = (query: string) => {
  const q = query.toLowerCase();
  return exerciseLibrary.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q)
  );
};

export interface ExerciseDemoOption {
  id: string;
  label: string;
  searchQuery: string;
  embedUrl: string;
  source: 'fixed' | 'search';
}

const cuesByMuscleGroup: Record<string, string> = {
  Peito: 'Escapulas fixas, peito alto e controle a fase de descida.',
  Costas: 'Inicie o movimento pelas costas, nao pelos bracos.',
  Ombros: 'Evite compensar com lombar; mantenha o core firme.',
  Biceps: 'Mantenha o cotovelo estavel e evite balanco de tronco.',
  Triceps: 'Foque em extensao total sem perder alinhamento do ombro.',
  Pernas: 'Priorize amplitude segura e joelhos alinhados ao pe.',
  Gluteos: 'Contraia no topo e controle o retorno do movimento.',
  Panturrilha: 'Suba completo e desca em amplitude total.',
  Abdomen: 'Controle respiracao e mantenha a lombar protegida.',
  Lombar: 'Neutralidade da coluna em todo o movimento.',
  Cardio: 'Ajuste intensidade por zona alvo e mantenha tecnica.',
  Funcional: 'Movimento tecnico primeiro, velocidade depois.',
};

const buildYoutubeSearchEmbedUrl = (query: string): string =>
  `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;

const buildYoutubeVideoEmbedUrl = (videoId: string): string =>
  `https://www.youtube.com/embed/${videoId}?rel=0`;

const normalizeExerciseName = (exerciseName: string): string =>
  exerciseName.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeForMatch = (value: string): string =>
  normalizeExerciseName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

type DemoRule = {
  pattern: RegExp;
  videoId: string;
};

const fixedDemoRules: DemoRule[] = [
  { pattern: /supino inclinado/, videoId: 'WP1VLAt8hbM' },
  { pattern: /supino declinado/, videoId: 'J2g6qPBJfqo' },
  { pattern: /supino reto|supino fechado/, videoId: 'EZMYCLKuGow' },
  { pattern: /crucifixo inclinado/, videoId: 'uy9Xk3SVrms' },
  { pattern: /crucifixo declinado/, videoId: 'zdkX5_Gcdq8' },
  { pattern: /crucifixo|peck deck/, videoId: 'uDMmccuPVPQ' },
  { pattern: /crossover/, videoId: 'jqTlJt3JXzQ' },
  { pattern: /flexao/, videoId: 'dHgoYiCraCw' },
  { pattern: /pullover/, videoId: '-KaMXMMIVrU' },
  { pattern: /remada|serrote/, videoId: 'm4h4jT9patY' },
  { pattern: /puxada|pull-?down|barra fixa|chin-up/, videoId: 'v6-QIOY0nW0' },
  { pattern: /face pull/, videoId: 'v6-QIOY0nW0' },
  { pattern: /desenvolvimento|arnold|clean and press/, videoId: 'LarRgxOf1Yk' },
  { pattern: /elevacao lateral|elevacao frontal/, videoId: 'IwWvZ0rlNXs' },
  { pattern: /encolhimento|trap/, videoId: 'RhGjwIUe16E' },
  { pattern: /triceps testa/, videoId: 'zznCYBVZOVA' },
  { pattern: /triceps.*pulley|polia alta/, videoId: 'dTqDKC0D6P4' },
  { pattern: /triceps.*frances/, videoId: 'YJ4kGE3eemY' },
  { pattern: /triceps.*coice|kickback/, videoId: 'PyKv23F-fVM' },
  { pattern: /triceps|mergulho|paralela/, videoId: 'TCVj8cliLNo' },
  { pattern: /rosca martelo/, videoId: '0qkQy8V2FC0' },
  { pattern: /rosca alternada/, videoId: 'S1HAcTVQVYE' },
  { pattern: /rosca scott/, videoId: 'zpTK6eihdSA' },
  { pattern: /rosca concentrada/, videoId: 'EEpvOQAAtRo' },
  { pattern: /rosca/, videoId: 'Q8TqfD8E7BU' },
  { pattern: /agachamento frontal/, videoId: 'syfDrU220FU' },
  { pattern: /agachamento sumo/, videoId: 'O6Cmxez6D0k' },
  { pattern: /agachamento bulgaro/, videoId: 'IGf9fR4Y7Iw' },
  { pattern: /agachamento|hack squat|box squat|pistol squat/, videoId: 'zgk71dUUt0Y' },
  { pattern: /leg press/, videoId: 'nY8UsiAqwds' },
  { pattern: /stiff|levantamento terra romeno/, videoId: 'u1E3_u2gJYE' },
  { pattern: /cadeira extensora/, videoId: 'el3oHblB5DM' },
  { pattern: /mesa flexora/, videoId: '2-ULaRrQa7c' },
  { pattern: /cadeira flexora/, videoId: 'Zss6E3VU6X0' },
  { pattern: /adutora/, videoId: 'Wf602gn_9zU' },
  { pattern: /abdutora/, videoId: 'e2gmqTG1OgQ' },
  { pattern: /hip thrust|elevacao pelvica|ponte de gluteos/, videoId: 'ptK0azwOXwM' },
  { pattern: /coice/, videoId: 'JdHbXlggr6Q' },
  { pattern: /panturrilha.*leg press/, videoId: 'wCXvfH_-BLg' },
  { pattern: /panturrilha.*sentad|gemeos sentad/, videoId: 'jMWs_p-W9gY' },
  { pattern: /panturrilha|gemeos/, videoId: '824pMjvGXgc' },
  { pattern: /prancha/, videoId: 'qNRqGqESAWU' },
  { pattern: /abdomen|crunch|russian twist|bicycle|hollow|v-ups|ab wheel/, videoId: '7YxVRiATugo' },
];

const getFixedDemoVideoId = (exerciseName: string): string | null => {
  const normalized = normalizeForMatch(exerciseName);
  const rule = fixedDemoRules.find((item) => item.pattern.test(normalized));
  return rule?.videoId ?? null;
};

export const getExerciseDemoOptions = (
  exerciseName: string,
  muscleGroup?: string,
): ExerciseDemoOption[] => {
  const normalizedName = normalizeExerciseName(exerciseName);
  const groupHint = muscleGroup ? ` ${muscleGroup}` : '';
  const fixedVideoId = getFixedDemoVideoId(exerciseName);

  const fixedOption: ExerciseDemoOption[] = fixedVideoId
    ? [
        {
          id: 'fixed',
          label: 'Modelo fixo',
          searchQuery: 'Video fixo selecionado para este exercicio',
          embedUrl: buildYoutubeVideoEmbedUrl(fixedVideoId),
          source: 'fixed',
        },
      ]
    : [];

  const searchQuery = `${normalizedName}${groupHint} execucao correta academia`.trim();
  const searchOption: ExerciseDemoOption = {
    id: 'yt-search',
    label: 'Buscar no YouTube',
    searchQuery,
    embedUrl: buildYoutubeSearchEmbedUrl(searchQuery),
    source: 'search',
  };

  return [...fixedOption, searchOption];
};

export const getExerciseDemoEmbedUrl = (exerciseName: string): string =>
  getExerciseDemoOptions(exerciseName)[0].embedUrl;

export const getExerciseCoachCue = (muscleGroup: string): string =>
  cuesByMuscleGroup[muscleGroup] ?? 'Mantenha execucao controlada e postura estavel.';
