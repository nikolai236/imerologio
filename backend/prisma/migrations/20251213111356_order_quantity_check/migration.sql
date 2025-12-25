ALTER TABLE "Order"
ADD CONSTRAINT "Order_quantity_gt_0"
CHECK ("quantity" > 0);