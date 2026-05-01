export interface LibraryExercise {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source?: 'core' | 'animatic';
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

export const exerciseLibrary: LibraryExercise[] = [
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
  { id: 'ex-310', name: 'Rosca 21s', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-311', name: 'Rosca Spider (Halter)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-312', name: 'Rosca com Pegada Fechada', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-313', name: 'Rosca no Banco Scott (Maquina)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-314', name: 'Rosca Unilateral (Cabos)', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-315', name: 'Rosca com Elastico', muscleGroup: 'Biceps', category: 'Isolamento', equipment: 'Elastico', difficulty: 'beginner' },

  // TRICEPS
  { id: 'ex-401', name: 'Triceps Testa (Barra W)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-402', name: 'Triceps Testa (Halter)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-403', name: 'Triceps Frances (Halter)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-404', name: 'Triceps na Polia Alta (Barra)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-405', name: 'Triceps na Polia Alta (Cordas)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-406', name: 'Mergulho no Banco (Bench Dip)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-407', name: 'Mergulho (Paralelas)', muscleGroup: 'Triceps', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-408', name: 'Supino Fechado', muscleGroup: 'Triceps', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-409', name: 'Kickback (Halter)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-410', name: 'Kickback (Cabos)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-411', name: 'Triceps com Elastico', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Elastico', difficulty: 'beginner' },
  { id: 'ex-412', name: 'Triceps Unilateral (Cabos)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-413', name: 'Triceps Maquina', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-414', name: 'Triceps Pike (Peso Corporal)', muscleGroup: 'Triceps', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-415', name: 'Triceps Diamond Push-up', muscleGroup: 'Triceps', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'intermediate' },

  // PERNAS
  { id: 'ex-501', name: 'Agachamento Livre (Barra)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-502', name: 'Agachamento Frontal', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'advanced' },
  { id: 'ex-503', name: 'Agachamento Hack (Maquina)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-504', name: 'Agachamento Smith', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Smith', difficulty: 'beginner' },
  { id: 'ex-505', name: 'Agachamento Bulgaro', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-506', name: 'Agachamento Sumo', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-507', name: 'Agachamento com Peso Corporal', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-508', name: 'Leg Press 45°', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-509', name: 'Leg Press Horizontal', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-510', name: 'Cadeira Extensora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-511', name: 'Mesa Flexora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-512', name: 'Cadeira Flexora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-513', name: 'Avanco (Lunge) com Halteres', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-514', name: 'Avanco com Barra', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-515', name: 'Avanco Reverso', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-516', name: 'Avanco Lateral', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-517', name: 'Passada (Step-up)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-518', name: 'Stiff (Barra)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-519', name: 'Stiff com Halteres', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-520', name: 'Good Morning', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'advanced' },
  { id: 'ex-521', name: 'Maquina Abdutora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-522', name: 'Maquina Aduutora', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-523', name: 'Sissy Squat', muscleGroup: 'Pernas', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-524', name: 'Box Squat', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-525', name: 'Pistol Squat', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-526', name: 'Hack Squat (Maquina)', muscleGroup: 'Pernas', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },

  // GLUTEOS
  { id: 'ex-601', name: 'Hip Thrust (Barra)', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Barra', difficulty: 'intermediate' },
  { id: 'ex-602', name: 'Hip Thrust (Halter)', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-603', name: 'Hip Thrust (Maquina)', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-604', name: 'Ponte de Gluteos', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-605', name: 'Ponte de Gluteos com Peso', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-606', name: 'Coice na Maquina', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-607', name: 'Coice com Cabo', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-608', name: 'Coice com Halter', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-609', name: 'Levantamento Terra Romeno', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-610', name: 'Passada Curtsy', muscleGroup: 'Gluteos', category: 'Composto', equipment: 'Halter', difficulty: 'intermediate' },
  { id: 'ex-611', name: 'Fire Hydrant', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-612', name: 'Donkey Kick', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-613', name: 'Clam Shell', muscleGroup: 'Gluteos', category: 'Isolamento', equipment: 'Elastico', difficulty: 'beginner' },

  // PANTURRILHA
  { id: 'ex-701', name: 'Panturrilha em Pe (Maquina)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-702', name: 'Panturrilha em Pe (Barra)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Barra', difficulty: 'beginner' },
  { id: 'ex-703', name: 'Panturrilha em Pe (Halter)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-704', name: 'Panturrilha Sentado', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-705', name: 'Panturrilha na Leg Press', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-706', name: 'Panturrilha no Degrau', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-707', name: 'Panturrilha em Pe Unilateral', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-708', name: 'Tibial Anterior (Maquina)', muscleGroup: 'Panturrilha', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },

  // ABDOMEN
  { id: 'ex-801', name: 'Crunch Abdominal', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-802', name: 'Crunch na Maquina', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-803', name: 'Crunch na Polia', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Cabos', difficulty: 'beginner' },
  { id: 'ex-804', name: 'Prancha (Plank)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-805', name: 'Prancha Lateral', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-806', name: 'Prancha com Elevacao', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-807', name: 'Eleicao de Pernas', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-808', name: 'Eleicao de Pernas no Banco', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-809', name: 'Eleicao de Pernas na Maquina', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Maquina', difficulty: 'beginner' },
  { id: 'ex-810', name: 'Russian Twist (Halter)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Halter', difficulty: 'beginner' },
  { id: 'ex-811', name: 'Bicicleta (Bicycle Crunch)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-812', name: 'Mountain Climbers', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-813', name: 'Dead Bug', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-814', name: 'Toe Touch', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'beginner' },
  { id: 'ex-815', name: 'Hollow Body Hold', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'intermediate' },
  { id: 'ex-816', name: 'L-sit (Paralelas)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Paralelas', difficulty: 'advanced' },
  { id: 'ex-817', name: 'Dragon Flag', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'advanced' },
  { id: 'ex-818', name: 'Ab Wheel', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Ab Wheel', difficulty: 'intermediate' },
  { id: 'ex-819', name: 'Suspended Pikes (TRX)', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'TRX', difficulty: 'advanced' },
  { id: 'ex-820', name: 'V-ups', muscleGroup: 'Abdomen', category: 'Isolamento', equipment: 'Peso Corporal', difficulty: 'intermediate' },

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
