ALTER TABLE "ingredients" RENAME COLUMN "caloriesPer100g" TO "caloriesPerUnit";
ALTER TABLE "ingredients" RENAME COLUMN "carbsPer100g" TO "carbsPerUnit";
ALTER TABLE "ingredients" RENAME COLUMN "fatPer100g" TO "fatPerUnit";
ALTER TABLE "ingredients" RENAME COLUMN "pricePerKg" TO "pricePerUnit";
ALTER TABLE "ingredients" RENAME COLUMN "proteinPer100g" TO "proteinPerUnit";

ALTER TABLE "recipe_ingredients" RENAME COLUMN "quantityGrams" TO "quantity";
ALTER TABLE "recipe_ingredients" RENAME COLUMN "unitPricePerKg" TO "unitPrice";
