/**
 * Default Subscription Package Tiers Seed
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const hasTable = await knex.schema.hasTable('packages');
  if (hasTable) {
    await knex('packages')
      .insert([
        {
          id: 'free',
          name: 'Free Explorer',
          tier: 'free',
          price_monthly: 0.00,
          limits: JSON.stringify({
            max_sub_users: 1,
            max_data_sources: 2,
            max_file_size_mb: 5,
            allowed_cleansing_ops: ['trim_whitespace', 'remove_duplicates'],
            allowed_widget_types: ['table', 'bar', 'line'],
            insight_depth: 'basic',
          }),
        },
        {
          id: 'starter',
          name: 'Starter Team',
          tier: 'starter',
          price_monthly: 29.00,
          limits: JSON.stringify({
            max_sub_users: 5,
            max_data_sources: 10,
            max_file_size_mb: 25,
            allowed_cleansing_ops: ['trim_whitespace', 'remove_duplicates', 'fill_missing', 'standardize_types'],
            allowed_widget_types: ['table', 'bar', 'line', 'pie', 'kpi'],
            insight_depth: 'standard',
          }),
        },
        {
          id: 'growth',
          name: 'Growth Business',
          tier: 'growth',
          price_monthly: 79.00,
          limits: JSON.stringify({
            max_sub_users: 25,
            max_data_sources: 50,
            max_file_size_mb: 100,
            allowed_cleansing_ops: ['trim_whitespace', 'remove_duplicates', 'fill_missing', 'standardize_types', 'remove_outliers'],
            allowed_widget_types: ['table', 'bar', 'line', 'pie', 'kpi', 'scatter', 'area', 'donut'],
            insight_depth: 'advanced',
          }),
        },
        {
          id: 'enterprise',
          name: 'Enterprise Pro',
          tier: 'enterprise',
          price_monthly: 199.00,
          limits: JSON.stringify({
            max_sub_users: 1000,
            max_data_sources: 500,
            max_file_size_mb: 500,
            allowed_cleansing_ops: ['*'],
            allowed_widget_types: ['*'],
            insight_depth: 'deep',
          }),
        },
      ])
      .onConflict('id')
      .merge();
  }
};
