// Cypress E2E Authentication Tests for MEAN Login Portal
// Installation: npm install --save-dev cypress
// Run: npx cypress open

describe('Authentication Tests', () => {
  const baseUrl = 'http://localhost:4200'; // Update with your Angular app URL
  const apiUrl = 'http://localhost:3000/api'; // Update with your Node.js API URL

  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Login Functionality', () => {
    it('TC-AUTH-001: Should successfully login with valid credentials', () => {
      cy.visit(`${baseUrl}/login`);
      
      // Enter valid credentials
      cy.get('input[name="email"]').type('test.user@example.com');
      cy.get('input[name="password"]').type('Test@1234');
      
      // Submit login form
      cy.get('button[type="submit"]').click();
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome').should('be.visible');
      
      // Verify token is stored
      cy.window().then((window) => {
        const token = window.localStorage.getItem('token');
        expect(token).to.not.be.null;
      });
    });

    it('TC-AUTH-002: Should fail login with invalid password', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[name="email"]').type('test.user@example.com');
      cy.get('input[name="password"]').type('WrongPassword@999');
      cy.get('button[type="submit"]').click();
      
      // Verify error message
      cy.contains('Invalid email or password').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('TC-AUTH-003: Should show validation errors for empty fields', () => {
      cy.visit(`${baseUrl}/login`);
      
      // Click submit without entering credentials
      cy.get('button[type="submit"]').click();
      
      // Verify validation messages
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('TC-AUTH-004: Should reject invalid email format', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[name="email"]').type('notanemail');
      cy.get('input[name="password"]').type('Test@1234');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid email format').should('be.visible');
    });

    it('TC-AUTH-005: Should fail login with non-existent account', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[name="email"]').type('nobody@example.com');
      cy.get('input[name="password"]').type('Password@123');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid email or password').should('be.visible');
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.visit(`${baseUrl}/login`);
      cy.get('input[name="email"]').type('test.user@example.com');
      cy.get('input[name="password"]').type('Test@1234');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('TC-AUTH-006: Should successfully logout', () => {
      // Click logout button
      cy.get('[data-cy="logout-button"]').click(); // Use data-cy attribute for reliable selection
      
      // Verify redirect to login page
      cy.url().should('include', '/login');
      
      // Verify token is removed
      cy.window().then((window) => {
        const token = window.localStorage.getItem('token');
        expect(token).to.be.null;
      });
    });

    it('TC-AUTH-007: Should not access protected routes after logout', () => {
      cy.get('[data-cy="logout-button"]').click();
      
      // Try to access dashboard directly
      cy.visit(`${baseUrl}/dashboard`);
      
      // Should be redirected to login
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    it('TC-AUTH-008: Should request password reset successfully', () => {
      cy.visit(`${baseUrl}/login`);
      
      // Click forgot password link
      cy.contains('Forgot Password').click();
      cy.url().should('include', '/forgot-password');
      
      // Enter email
      cy.get('input[name="email"]').type('test.user@example.com');
      cy.get('button[type="submit"]').click();
      
      // Verify success message
      cy.contains('Password reset email sent').should('be.visible');
    });

    it('TC-AUTH-009: Should reject password reset for non-existent email', () => {
      cy.visit(`${baseUrl}/forgot-password`);
      
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email not found').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('TC-AUTH-010: Should maintain session on page refresh', () => {
      // Login
      cy.visit(`${baseUrl}/login`);
      cy.get('input[name="email"]').type('test.user@example.com');
      cy.get('input[name="password"]').type('Test@1234');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
      
      // Refresh page
      cy.reload();
      
      // Should still be on dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome').should('be.visible');
    });

    it('TC-AUTH-011: Should redirect to login when accessing protected route without authentication', () => {
      // Try to access dashboard without logging in
      cy.visit(`${baseUrl}/dashboard`);
      
      // Should be redirected to login
      cy.url().should('include', '/login');
    });
  });

  describe('Security Tests', () => {
    it('TC-AUTH-012: Should prevent SQL injection attempts', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[name="email"]').type("' OR '1'='1");
      cy.get('input[name="password"]').type("' OR '1'='1");
      cy.get('button[type="submit"]').click();
      
      // Should show error, not login
      cy.contains('Invalid email or password').should('be.visible');
      cy.url().should('include', '/login');
    });

    it('TC-AUTH-013: Should prevent XSS attempts in login fields', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[name="email"]').type('<script>alert("XSS")</script>@test.com');
      cy.get('input[name="password"]').type('Test@1234');
      cy.get('button[type="submit"]').click();
      
      // Script should not execute
      cy.on('window:alert', () => {
        throw new Error('XSS alert should not fire');
      });
    });
  });
});

// Additional custom commands for reusability (add to cypress/support/commands.js)
/*
Cypress.Commands.add('login', (email = 'test.user@example.com', password = 'Test@1234') => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
});
*/