import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDailyUsageFields1755350794541 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add daily usage tracking fields to user_sessions table
        await queryRunner.addColumns("user_sessions", [
            new TableColumn({
                name: "dailyUsageCount",
                type: "int",
                default: 0,
            }),
            new TableColumn({
                name: "lastUsageDate",
                type: "date",
                isNullable: true,
            }),
            new TableColumn({
                name: "maxDailyUsage",
                type: "int",
                default: 20,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the added columns
        await queryRunner.dropColumns("user_sessions", [
            "dailyUsageCount",
            "lastUsageDate", 
            "maxDailyUsage",
        ]);
    }
}
