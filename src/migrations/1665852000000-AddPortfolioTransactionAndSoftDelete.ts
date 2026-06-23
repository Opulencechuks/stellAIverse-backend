import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddPortfolioTransactionAndSoftDelete1665852000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add soft delete column to portfolios if not exists
    await queryRunner.addColumn('portfolios', new TableColumn({
      name: 'deletedAt',
      type: 'timestamp',
      isNullable: true,
    }));

    // Create portfolio_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'portfolio_transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'type', type: 'enum', enum: ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL'] },
          { name: 'date', type: 'timestamp' },
          { name: 'amount', type: 'decimal', precision: 18, scale: 8 },
          { name: 'price', type: 'decimal', precision: 18, scale: 8, isNullable: true },
          { name: 'fees', type: 'decimal', precision: 18, scale: 8, isNullable: true },
          { name: 'chain', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
          { name: 'portfolioId', type: 'uuid' },
        ],
        indices: [
          { columnNames: ['portfolioId', 'type', 'date'] },
        ],
      })
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'portfolio_transactions',
      new TableForeignKey({
        columnNames: ['portfolioId'],
        referencedTableName: 'portfolios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('portfolio_transactions');
    const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf('portfolioId') !== -1);
    if (foreignKey) await queryRunner.dropForeignKey('portfolio_transactions', foreignKey);

    // Drop table
    await queryRunner.dropTable('portfolio_transactions');

    // Remove soft delete column from portfolios
    await queryRunner.dropColumn('portfolios', 'deletedAt');
  }
}
