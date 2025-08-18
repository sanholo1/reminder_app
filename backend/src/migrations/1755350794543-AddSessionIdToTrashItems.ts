import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSessionIdToTrashItems1755350794543 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add sessionId column to trash_items table
        await queryRunner.addColumn("trash_items", new TableColumn({
            name: "sessionId",
            type: "varchar",
            length: "255",
            isNullable: false,
            default: "''"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the sessionId column
        await queryRunner.dropColumn("trash_items", "sessionId");
    }
}
