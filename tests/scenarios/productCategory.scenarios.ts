export type ProductCategoryScenario = {
  id: string;
  title: string;
  gherkin: string;
  blockSearchText: string;
  blockBreadcrumbLabel: RegExp;
  headingText: string;
  numberOfCategories: number;
  enableHeading: boolean;
};

export const productCategoryScenarios: ProductCategoryScenario[] = [
  {
    id: 'pcat-1',
    title: 'Scenario: configure Product Category #1 and verify frontend',
    gherkin: `Feature: WowStore Product Category Block

Scenario: Configure "Product Category #1" block and verify on frontend
  Given I am authenticated in WordPress admin
  And I navigate to the new post page
  When I add a post title
  And I open the Block Inserter and search for "Product Category #1"
  And I insert the "Product Category #1" block
  Then I should see the block inserted successfully
  When I configure the block settings:
    | numberOfCategories | 3   |
    | enableHeading      | yes |
  And I publish the post
  And I view the post on the frontend
  Then the Product Category block should be visible
  And it should render exactly 3 categories`,
    blockSearchText: 'Product Category #1',
    blockBreadcrumbLabel: /Product Category #1/i,
    headingText: 'Product Categories Block 1',
    numberOfCategories: 3,
    enableHeading: true,
  },
];
