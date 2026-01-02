# Stock Items Excel Import Template

## Required Columns (in order):

1. **Project Name** (Required) - The name of the project
2. **Warehouse Name** (Required) - The name of the warehouse
3. **Name** (Required) - Product name
4. **SKU** (Optional) - Stock Keeping Unit (auto-generated if empty)
5. **Description** (Optional) - Product description
6. **UOM** (Required) - Unit of Measure (e.g., "KG", "TON", "BAG", "PALLET")
6. **Min Unit Price** (Required) - Minimum unit price (number)
7. **Default Unit Price** (Required) - Default unit price (number)
8. **Min Order Qty** (Required) - Minimum order quantity (number)
9. **Truckload Only** (Optional) - "Yes" or "No" (default: "No")
10. **Is Active** (Optional) - "Yes" or "No" (default: "Yes")

## Example Data:

| Project Name | Warehouse Name | Name | SKU | Description | UOM | Min Unit Price | Default Unit Price | Min Order Qty | Truckload Only | Is Active |
|--------------|----------------|------|-----|-------------|-----|----------------|-------------------|---------------|----------------|-----------|
| Katonto | Main Warehouse | Cement 50kg | CEM-50KG | Portland Cement 50kg bag | BAG | 8.50 | 10.00 | 100 | No | Yes |
| Katonto | Main Warehouse | Steel Rebar 12mm | STL-12MM | Steel reinforcement bar 12mm | TON | 850.00 | 900.00 | 1 | No | Yes |

## Notes:
- First row should contain column headers
- Project Name and Warehouse Name must match existing projects/warehouses in the system
- Prices and quantities should be numbers (decimals allowed)
- SKU will be auto-generated if left empty
