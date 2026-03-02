/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `purchases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "purchases_transaction_id_key" ON "purchases"("transaction_id");
