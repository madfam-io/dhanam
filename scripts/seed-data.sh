#!/bin/bash

# Dhanam Seed Data Generation Script
# This script generates realistic seed data for testing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-local}
SEED_TYPE=${2:-demo}  # demo, test, stress
API_URL=${API_URL:-http://localhost:4000}

# Functions
print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_section() {
    echo -e "${BLUE}═══ $1 ═══${NC}"
}

# Generate demo data
generate_demo_data() {
    print_section "Generating Demo Data"
    
    cd apps/api
    
    # Run the seed script with demo flag
    NODE_ENV=development SEED_TYPE=demo pnpm db:seed
    
    cd ../..
    
    print_success "Demo data generated"
    echo ""
    echo "Demo accounts created:"
    echo "  - admin@dhanam.com / Admin123!"
    echo "  - user@dhanam.com / User123!"
    echo "  - demo@dhanam.com / Demo123!"
}

# Generate test data
generate_test_data() {
    print_section "Generating Test Data"
    
    cd apps/api
    
    # Create test data script
    cat > scripts/test-seed.ts <<'EOF'
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { addDays, subDays, startOfMonth } from 'date-fns';

const prisma = new PrismaClient();

async function generateTestData() {
  console.log('Generating test data...');
  
  // Create test users
  const testUsers = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: `test${i}@dhanam.com`,
        passwordHash: await hash('Test123!', 10),
        name: faker.person.fullName(),
        locale: i % 2 === 0 ? 'en' : 'es',
        isVerified: true,
      },
    });
    testUsers.push(user);
    console.log(`Created user: ${user.email}`);
  }
  
  // Create spaces and data for each user
  for (const user of testUsers) {
    // Personal space
    const personalSpace = await prisma.space.create({
      data: {
        name: `${user.name}'s Personal`,
        type: 'personal',
        currency: user.locale === 'es' ? 'MXN' : 'USD',
        userSpaces: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });
    
    // Create accounts
    const accounts = [];
    
    // Bank accounts
    const checking = await prisma.account.create({
      data: {
        spaceId: personalSpace.id,
        name: 'Checking Account',
        type: 'checking',
        provider: 'manual',
        currency: personalSpace.currency,
        balance: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
        isActive: true,
      },
    });
    accounts.push(checking);
    
    const savings = await prisma.account.create({
      data: {
        spaceId: personalSpace.id,
        name: 'Savings Account',
        type: 'savings',
        provider: 'manual',
        currency: personalSpace.currency,
        balance: faker.number.float({ min: 5000, max: 50000, precision: 0.01 }),
        isActive: true,
      },
    });
    accounts.push(savings);
    
    // Credit card
    const creditCard = await prisma.account.create({
      data: {
        spaceId: personalSpace.id,
        name: 'Credit Card',
        type: 'credit_card',
        provider: 'manual',
        currency: personalSpace.currency,
        balance: -faker.number.float({ min: 100, max: 3000, precision: 0.01 }),
        isActive: true,
      },
    });
    accounts.push(creditCard);
    
    // Create budget
    const budget = await prisma.budget.create({
      data: {
        spaceId: personalSpace.id,
        name: 'Monthly Budget',
        period: 'monthly',
        startDate: startOfMonth(new Date()),
        isActive: true,
      },
    });
    
    // Create categories
    const categories = await prisma.$transaction([
      prisma.category.create({
        data: {
          spaceId: personalSpace.id,
          name: 'Groceries',
          icon: '🛒',
          color: '#4CAF50',
          budgetCategories: {
            create: {
              budgetId: budget.id,
              amount: personalSpace.currency === 'MXN' ? 8000 : 400,
            },
          },
        },
      }),
      prisma.category.create({
        data: {
          spaceId: personalSpace.id,
          name: 'Transportation',
          icon: '🚗',
          color: '#2196F3',
          budgetCategories: {
            create: {
              budgetId: budget.id,
              amount: personalSpace.currency === 'MXN' ? 3000 : 150,
            },
          },
        },
      }),
      prisma.category.create({
        data: {
          spaceId: personalSpace.id,
          name: 'Entertainment',
          icon: '🎬',
          color: '#FF9800',
          budgetCategories: {
            create: {
              budgetId: budget.id,
              amount: personalSpace.currency === 'MXN' ? 2000 : 100,
            },
          },
        },
      }),
      prisma.category.create({
        data: {
          spaceId: personalSpace.id,
          name: 'Utilities',
          icon: '💡',
          color: '#9C27B0',
          budgetCategories: {
            create: {
              budgetId: budget.id,
              amount: personalSpace.currency === 'MXN' ? 1500 : 75,
            },
          },
        },
      }),
      prisma.category.create({
        data: {
          spaceId: personalSpace.id,
          name: 'Salary',
          icon: '💰',
          color: '#4CAF50',
          type: 'income',
        },
      }),
    ]);
    
    // Create transactions for the last 90 days
    const transactions = [];
    const today = new Date();
    
    for (let i = 0; i < 90; i++) {
      const date = subDays(today, i);
      
      // Random number of transactions per day (0-5)
      const transactionsPerDay = faker.number.int({ min: 0, max: 5 });
      
      for (let j = 0; j < transactionsPerDay; j++) {
        const isIncome = faker.number.float() < 0.1; // 10% chance of income
        const category = isIncome 
          ? categories.find(c => c.type === 'income')
          : faker.helpers.arrayElement(categories.filter(c => c.type !== 'income'));
        
        const amount = isIncome
          ? faker.number.float({ min: 1000, max: 5000, precision: 0.01 })
          : -faker.number.float({ min: 10, max: 500, precision: 0.01 });
        
        const account = isIncome
          ? checking
          : faker.helpers.arrayElement(accounts);
        
        await prisma.transaction.create({
          data: {
            spaceId: personalSpace.id,
            accountId: account.id,
            categoryId: category?.id,
            amount,
            currency: personalSpace.currency,
            description: faker.commerce.productName(),
            date,
            pending: faker.number.float() < 0.1, // 10% pending
          },
        });
      }
    }
    
    // Monthly salary on the 1st
    if (today.getDate() >= 1) {
      const salaryAmount = personalSpace.currency === 'MXN' ? 50000 : 2500;
      await prisma.transaction.create({
        data: {
          spaceId: personalSpace.id,
          accountId: checking.id,
          categoryId: categories.find(c => c.type === 'income')?.id,
          amount: salaryAmount,
          currency: personalSpace.currency,
          description: 'Monthly Salary',
          date: startOfMonth(today),
        },
      });
    }
    
    console.log(`Created data for space: ${personalSpace.name}`);
  }
  
  console.log('Test data generation completed!');
}

generateTestData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF
    
    # Install faker if not already installed
    pnpm add -D @faker-js/faker
    
    # Run the test seed script
    pnpm tsx scripts/test-seed.ts
    
    # Clean up
    rm scripts/test-seed.ts
    
    cd ../..
    
    print_success "Test data generated"
    echo ""
    echo "Test accounts created:"
    echo "  - test1@dhanam.com / Test123!"
    echo "  - test2@dhanam.com / Test123!"
    echo "  - test3@dhanam.com / Test123!"
    echo "  - test4@dhanam.com / Test123!"
    echo "  - test5@dhanam.com / Test123!"
}

# Generate stress test data
generate_stress_data() {
    print_section "Generating Stress Test Data"
    
    print_info "This will create a large amount of data for performance testing"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Stress test data generation cancelled"
        exit 0
    fi
    
    cd apps/api
    
    # Create stress test script
    cat > scripts/stress-seed.ts <<'EOF'
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function generateStressData() {
  console.log('Generating stress test data...');
  console.log('This may take several minutes...');
  
  const USER_COUNT = 100;
  const ACCOUNTS_PER_USER = 5;
  const TRANSACTIONS_PER_ACCOUNT = 1000;
  
  // Create users in batches
  console.log(`Creating ${USER_COUNT} users...`);
  const users = [];
  const passwordHash = await hash('Stress123!', 10);
  
  for (let batch = 0; batch < USER_COUNT / 10; batch++) {
    const batchUsers = [];
    for (let i = 0; i < 10; i++) {
      const userNum = batch * 10 + i + 1;
      batchUsers.push({
        email: `stress${userNum}@dhanam.com`,
        passwordHash,
        name: faker.person.fullName(),
        locale: faker.helpers.arrayElement(['en', 'es']),
        isVerified: true,
      });
    }
    
    await prisma.user.createMany({
      data: batchUsers,
    });
    
    console.log(`Created batch ${batch + 1}/${USER_COUNT / 10}`);
  }
  
  // Get all created users
  const createdUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'stress',
      },
    },
  });
  
  // Create data for each user
  let userCount = 0;
  for (const user of createdUsers) {
    userCount++;
    console.log(`Processing user ${userCount}/${USER_COUNT}: ${user.email}`);
    
    // Create space
    const space = await prisma.space.create({
      data: {
        name: `${user.name}'s Space`,
        type: 'personal',
        currency: user.locale === 'es' ? 'MXN' : 'USD',
        userSpaces: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });
    
    // Create accounts
    const accounts = [];
    for (let i = 0; i < ACCOUNTS_PER_USER; i++) {
      const account = await prisma.account.create({
        data: {
          spaceId: space.id,
          name: faker.finance.accountName(),
          type: faker.helpers.arrayElement(['checking', 'savings', 'credit_card', 'investment']),
          provider: 'manual',
          currency: space.currency,
          balance: faker.number.float({ min: -5000, max: 50000, precision: 0.01 }),
          isActive: true,
        },
      });
      accounts.push(account);
    }
    
    // Create categories
    const categories = await prisma.$transaction([
      prisma.category.create({
        data: {
          spaceId: space.id,
          name: 'Food & Dining',
          icon: '🍔',
          color: '#FF5722',
        },
      }),
      prisma.category.create({
        data: {
          spaceId: space.id,
          name: 'Shopping',
          icon: '🛍️',
          color: '#E91E63',
        },
      }),
      prisma.category.create({
        data: {
          spaceId: space.id,
          name: 'Transport',
          icon: '🚌',
          color: '#3F51B5',
        },
      }),
      prisma.category.create({
        data: {
          spaceId: space.id,
          name: 'Bills',
          icon: '📄',
          color: '#009688',
        },
      }),
      prisma.category.create({
        data: {
          spaceId: space.id,
          name: 'Income',
          icon: '💵',
          color: '#4CAF50',
          type: 'income',
        },
      }),
    ]);
    
    // Create transactions in batches
    console.log(`  Creating ${ACCOUNTS_PER_USER * TRANSACTIONS_PER_ACCOUNT} transactions...`);
    
    for (const account of accounts) {
      const transactionBatches = [];
      
      for (let batch = 0; batch < TRANSACTIONS_PER_ACCOUNT / 100; batch++) {
        const batchTransactions = [];
        
        for (let i = 0; i < 100; i++) {
          const isIncome = faker.number.float() < 0.05; // 5% income
          const category = isIncome 
            ? categories.find(c => c.type === 'income')
            : faker.helpers.arrayElement(categories.filter(c => c.type !== 'income'));
          
          batchTransactions.push({
            spaceId: space.id,
            accountId: account.id,
            categoryId: category?.id,
            amount: isIncome
              ? faker.number.float({ min: 1000, max: 10000, precision: 0.01 })
              : -faker.number.float({ min: 1, max: 1000, precision: 0.01 }),
            currency: space.currency,
            description: faker.commerce.productName(),
            date: subDays(new Date(), faker.number.int({ min: 0, max: 365 })),
            pending: faker.number.float() < 0.05,
            metadata: {
              merchant: faker.company.name(),
              category: faker.commerce.department(),
            },
          });
        }
        
        await prisma.transaction.createMany({
          data: batchTransactions,
        });
      }
    }
  }
  
  // Display statistics
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.space.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.category.count(),
  ]);
  
  console.log('\nStress test data generation completed!');
  console.log('Statistics:');
  console.log(`  Users: ${stats[0]}`);
  console.log(`  Spaces: ${stats[1]}`);
  console.log(`  Accounts: ${stats[2]}`);
  console.log(`  Transactions: ${stats[3]}`);
  console.log(`  Categories: ${stats[4]}`);
}

generateStressData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF
    
    # Run the stress seed script
    pnpm tsx scripts/stress-seed.ts
    
    # Clean up
    rm scripts/stress-seed.ts
    
    cd ../..
    
    print_success "Stress test data generated"
}

# Clear all data
clear_data() {
    print_section "Clearing All Data"
    
    print_info "This will delete all data from the database"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Data clearing cancelled"
        exit 0
    fi
    
    cd apps/api
    
    # Create clear script
    cat > scripts/clear-data.ts <<'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('Clearing all data...');
  
  // Delete in correct order to respect foreign keys
  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.budgetCategory.deleteMany(),
    prisma.category.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.valuationHistory.deleteMany(),
    prisma.account.deleteMany(),
    prisma.provider.deleteMany(),
    prisma.userSpace.deleteMany(),
    prisma.space.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  
  console.log('All data cleared!');
}

clearData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF
    
    # Run the clear script
    pnpm tsx scripts/clear-data.ts
    
    # Clean up
    rm scripts/clear-data.ts
    
    cd ../..
    
    print_success "All data cleared"
}

# Main execution
case $SEED_TYPE in
    demo)
        generate_demo_data
        ;;
    test)
        generate_test_data
        ;;
    stress)
        generate_stress_data
        ;;
    clear)
        clear_data
        ;;
    *)
        echo "Usage: ./seed-data.sh [environment] [type]"
        echo ""
        echo "Arguments:"
        echo "  environment    The environment (default: local)"
        echo "  type          Seed type:"
        echo "                - demo: Basic demo data (3 users)"
        echo "                - test: Test data (5 users with transactions)"
        echo "                - stress: Stress test data (100 users, 500k+ transactions)"
        echo "                - clear: Clear all data"
        echo ""
        echo "Examples:"
        echo "  ./seed-data.sh local demo"
        echo "  ./seed-data.sh local test"
        echo "  ./seed-data.sh local stress"
        echo "  ./seed-data.sh local clear"
        exit 1
        ;;
esac