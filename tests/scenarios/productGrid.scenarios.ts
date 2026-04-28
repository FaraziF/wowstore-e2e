export type ProductGridScenario = {
  id: string;
  title: string;
  gherkin: string;
  blockSearchText: string;
  blockBreadcrumbLabel: RegExp;
  numberOfProducts: number;
  numberOfColumns: number;
};

export const productGridScenarios: ProductGridScenario[] = [
  {
    id: 'pgrid-1',
    title: 'Scenario: configure Product Grid #1 with columns and products, then verify frontend',
    gherkin: `Feature: WowStore Product Grid Block

Scenario: Configure "Product Grid #1" block with columns and number of products
  Given I am authenticated in WordPress admin
  And I navigate to the new post page
  When I add a post title
  And I open the Block Inserter and search for "Product Grid #1"
  And I insert the "Product Grid #1" block
  Then I should see the block inserted successfully
  When I configure the block settings:
    | numberOfProducts  | 6  |
    | numberOfColumns   | 5  |
  And I publish the post
  And I view the post on the frontend
  Then the Product Grid block should be visible
  And it should render exactly 6 products
  And it should display 5 columns layout
  And products should be displayed in a grid format`,
    blockSearchText: 'Product Grid #1',
    blockBreadcrumbLabel: /Product Grid #1/i,
    numberOfProducts: 6,
    numberOfColumns: 5,
  },
  
];
