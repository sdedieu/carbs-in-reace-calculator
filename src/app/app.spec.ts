import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the calculator title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Race fuel calculator');
  });

  it('should calculate totals from selected quantities', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as App & {
      setQuantity(productId: string, value: number): void;
      totals(): { calories: number; carbs: number; sugar: number };
    };

    app.setQuantity('maurten-gel-160', 2);
    app.setQuantity('baouw-electrolytes-blackberry', 1);

    expect(app.totals().carbs).toBe(81.5);
    expect(app.totals().calories).toBe(331);
    expect(app.totals().sugar).toBe(80.03);
  });
});
