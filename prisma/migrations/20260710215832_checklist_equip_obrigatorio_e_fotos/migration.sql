-- AlterEnum
ALTER TYPE "ChecklistItemTipo" ADD VALUE 'EquipObrigatorio';

-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
