import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminProduct, AdminProductService } from './services/admin-product.service';
import { AdminUser, AdminUserService } from './services/admin-user.service';
import { HealthService } from './services/health.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly backendStatus = signal('Checking connection');
  protected readonly backendDetails = signal('Waiting for Spring Boot');
  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly productName = signal('');
  protected readonly productCategory = signal('');
  protected readonly productPrice = signal<number | null>(null);
  protected readonly userName = signal('');
  protected readonly userEmail = signal('');
  protected readonly notice = signal('');

  private readonly healthService = inject(HealthService);
  private readonly adminProductService = inject(AdminProductService);
  private readonly adminUserService = inject(AdminUserService);

  constructor() {
    this.healthService.getHealth().subscribe({
      next: (response) => {
        this.backendStatus.set('Connected');
        this.backendDetails.set(`${response.service} heartbeat at ${response.timestamp}`);
      },
      error: () => {
        this.backendStatus.set('Backend unavailable');
        this.backendDetails.set('Start the Spring Boot app on port 8081');
      },
    });

    this.adminProductService.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => this.notice.set('Products could not be loaded.'),
    });

    this.adminUserService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => this.notice.set('Users could not be loaded.'),
    });
  }

  protected createProduct(): void {
    const name = this.productName().trim();
    const category = this.productCategory().trim();
    const price = this.productPrice();
    if (!name || !category || price === null || price < 0) {
      this.notice.set('Enter a product name, category, and valid price.');
      return;
    }

    this.adminProductService.createProduct({ name, category, price }).subscribe({
      next: (product) => {
        this.products.update((products) => [product, ...products]);
        this.productName.set('');
        this.productCategory.set('');
        this.productPrice.set(null);
        this.notice.set(`${product.name} was added to the catalogue.`);
      },
      error: () => this.notice.set('Product could not be created.'),
    });
  }

  protected createUser(): void {
    const username = this.userName().trim();
    const email = this.userEmail().trim();
    if (!username || !email) {
      this.notice.set('Enter a username and email address.');
      return;
    }

    this.adminUserService.createUser({ username, email }).subscribe({
      next: (user) => {
        this.users.update((users) => [user, ...users]);
        this.userName.set('');
        this.userEmail.set('');
        this.notice.set(`${user.username} was added.`);
      },
      error: () => this.notice.set('User could not be created.'),
    });
  }
}
