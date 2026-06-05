import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should expose the race fuel product catalog', () => {
    expect(service.products).toHaveLength(8);
    expect(service.products.map((product) => product.id)).toContain('maurten-gel-160');
    expect(service.products.map((product) => product.id)).toContain(
      'baouw-electrolytes-blackberry',
    );
  });

  it('should create empty quantities for every product', () => {
    expect(service.createEmptyQuantities()).toEqual(
      Object.fromEntries(service.products.map((product) => [product.id, 0])),
    );
  });
});
