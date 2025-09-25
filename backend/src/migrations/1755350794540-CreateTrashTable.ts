import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTrashTable1755350794540 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('trash_items');
        if (hasTable) return;
        await queryRunner.createTable(
            new Table({
                name: "trash_items",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "255",
                        isPrimary: true,
                    },
                    {
                        name: "activity",
                        type: "varchar",
                        length: "500",
                    },
                    {
                        name: "category",
                        type: "varchar",
                        length: "100",
                        isNullable: true,
                    },
                    {
                        name: "datetime",
                        type: "datetime",
                    },
                    {
                        name: "deleted_at",
                        type: "datetime",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("trash_items");
    }
}
