import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FuelProduct, Nutrition, ProductId, ProductQuantities } from './product.model';
import { EMPTY_NUTRITION, ProductService } from './product.service';
import { CarbTargetPanelComponent } from './ui/carb-target-panel.component';
import { FuelPlanRowComponent } from './ui/fuel-plan-row.component';
import { NumberFieldComponent } from './ui/number-field.component';
import { NutritionSummaryCardComponent } from './ui/nutrition-summary-card.component';
import { ProductLibraryCardComponent } from './ui/product-library-card.component';

interface TotalCard {
  label: string;
  value: string;
  perHour: string;
  tone: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CarbTargetPanelComponent,
    FuelPlanRowComponent,
    NumberFieldComponent,
    NutritionSummaryCardComponent,
    ProductLibraryCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="min-h-screen bg-[#f6f8f3] bg-gradient-to-br from-emerald-800/10 via-[#f6f8f3] to-orange-500/10 px-4 py-4 text-stone-900 sm:px-7 sm:py-7"
      data-test="race-fuel-calculator"
    >
      <div class="mx-auto grid w-full max-w-[1440px] gap-5">
        <section
          class="grid items-center gap-6 rounded-lg border border-stone-900/10 bg-white/90 p-4 shadow-xl shadow-stone-900/5 lg:grid-cols-[minmax(240px,1fr)_minmax(300px,470px)_minmax(250px,360px)] lg:p-6"
          aria-labelledby="app-title"
          data-test="race-settings"
        >
          <div>
            <p class="mb-2 text-xs font-extrabold tracking-widest text-emerald-700 uppercase">
              Race nutrition
            </p>
            <h1
              id="app-title"
              class="max-w-[540px] text-4xl leading-none font-black tracking-normal text-balance sm:text-6xl lg:text-7xl"
            >
              {{ title() }}
            </h1>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Race settings">
            <app-number-field
              label="Hours"
              dataTest="race-hours"
              [value]="raceHours()"
              [min]="0"
              [max]="99"
              (valueChange)="setRaceHours($event)"
            />

            <app-number-field
              label="Minutes"
              dataTest="race-minutes"
              [value]="raceMinutes()"
              [min]="0"
              [max]="59"
              (valueChange)="setRaceMinutes($event)"
            />

            <app-number-field
              label="Carbs / h"
              dataTest="target-carbs"
              [value]="targetCarbsPerHour()"
              [min]="0"
              [max]="200"
              (valueChange)="setTargetCarbsPerHour($event)"
            />
          </div>

          <app-carb-target-panel
            [state]="carbTarget().state"
            [currentLabel]="format(totals().carbs, 'g', 1)"
            [goalLabel]="format(carbTarget().goal, 'g', 0)"
            [delta]="carbTarget().delta"
            [deltaLabel]="carbTargetDeltaLabel()"
            [progress]="carbTarget().progress"
          />
        </section>

        <section
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
          aria-label="Nutrition totals"
          data-test="nutrition-totals"
        >
          @for (card of totalCards(); track card.label) {
            <app-nutrition-summary-card
              [label]="card.label"
              [value]="card.value"
              [perHour]="card.perHour"
              [tone]="card.tone"
            />
          }
        </section>

        <section
          class="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]"
        >
          <section
            class="min-w-0 rounded-lg border border-stone-900/10 bg-white/90 p-4 shadow-xl shadow-stone-900/5 lg:p-5"
            aria-labelledby="planner-title"
            data-test="fuel-plan"
          >
            <div class="mb-4 flex items-center justify-between gap-4">
              <div>
                <p class="mb-2 text-xs font-extrabold tracking-widest text-emerald-700 uppercase">
                  Quantities
                </p>
                <h2 id="planner-title" class="text-2xl font-black tracking-normal">Fuel plan</h2>
              </div>
              <button
                class="min-h-10 rounded-lg border border-stone-900/15 bg-white px-4 font-black text-stone-900 hover:border-emerald-700/45 hover:bg-emerald-50"
                data-test="reset-plan"
                type="button"
                (click)="resetPlan()"
              >
                Reset
              </button>
            </div>

            <div
              class="grid min-w-0 gap-2"
              role="table"
              aria-label="Product quantities and calculated totals"
            >
              <div
                class="hidden min-w-0 grid-cols-[minmax(0,1.6fr)_minmax(150px,170px)_repeat(3,minmax(64px,0.55fr))] gap-3 px-3 pb-1 text-xs font-black text-stone-500 uppercase lg:grid"
                role="row"
              >
                <span role="columnheader">Product</span>
                <span role="columnheader">Qty</span>
                <span role="columnheader">Carbs</span>
                <span role="columnheader">Calories</span>
                <span role="columnheader">Sugar</span>
              </div>

              @for (product of products; track product.id) {
                <app-fuel-plan-row
                  [product]="product"
                  [quantity]="quantity(product.id)"
                  [carbsLabel]="format(productTotal(product, 'carbs'), 'g', 1)"
                  [caloriesLabel]="format(productTotal(product, 'calories'), 'kcal', 0)"
                  [sugarLabel]="format(productTotal(product, 'sugar'), 'g', 1)"
                  (quantityChange)="setQuantity(product.id, $event)"
                />
              }
            </div>
          </section>

          <aside
            class="rounded-lg border border-stone-900/10 bg-white/90 p-4 shadow-xl shadow-stone-900/5 lg:p-5"
            aria-labelledby="library-title"
            data-test="product-library"
          >
            <div class="mb-4">
              <p class="mb-2 text-xs font-extrabold tracking-widest text-emerald-700 uppercase">
                Per serving
              </p>
              <h2 id="library-title" class="text-2xl font-black tracking-normal">
                Product library
              </h2>
            </div>

            <div class="grid gap-3">
              @for (product of products; track product.id) {
                <app-product-library-card [product]="product" />
              }
            </div>
          </aside>
        </section>
      </div>
    </main>
  `,
})
export class App {
  private readonly productService = inject(ProductService);

  protected readonly title = signal('Race fuel calculator');
  protected readonly products = this.productService.products;
  protected readonly raceHours = signal(3);
  protected readonly raceMinutes = signal(30);
  protected readonly targetCarbsPerHour = signal(80);
  protected readonly quantities = signal<ProductQuantities>(
    this.productService.createEmptyQuantities(),
  );

  protected readonly durationHours = computed(() => {
    const hours = this.raceHours();
    const minutes = this.raceMinutes();

    return Math.max(0, hours + minutes / 60);
  });

  protected readonly totals = computed(() => {
    return this.products.reduce(
      (total, product) => this.addNutrition(total, product.nutrition, this.quantity(product.id)),
      { ...EMPTY_NUTRITION },
    );
  });

  protected readonly perHour = computed(() => {
    const duration = this.durationHours();

    if (duration === 0) {
      return { ...EMPTY_NUTRITION };
    }

    return this.scaleNutrition(this.totals(), 1 / duration);
  });

  protected readonly carbTarget = computed(() => {
    const goal = this.targetCarbsPerHour() * this.durationHours();
    const total = this.totals().carbs;
    const delta = total - goal;
    const progress = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;
    const state = Math.abs(delta) <= 10 ? 'on target' : delta > 0 ? 'over target' : 'under target';

    return {
      delta,
      goal,
      progress,
      state,
    };
  });

  protected readonly totalCards = computed<ReadonlyArray<TotalCard>>(() => {
    const totals = this.totals();
    const perHour = this.perHour();

    return [
      this.card('Carbs', totals.carbs, 'g', perHour.carbs, 'g/h', 'green'),
      this.card('Calories', totals.calories, 'kcal', perHour.calories, 'kcal/h', 'orange'),
      this.card('Sugar', totals.sugar, 'g', perHour.sugar, 'g/h', 'rose'),
      this.card('Sodium', totals.sodium, 'mg', perHour.sodium, 'mg/h', 'blue'),
      this.card('Caffeine', totals.caffeine, 'mg', perHour.caffeine, 'mg/h', 'charcoal'),
      this.card('Fiber', totals.fiber, 'g', perHour.fiber, 'g/h', 'lime'),
      this.card('Fat', totals.fat, 'g', perHour.fat, 'g/h', 'amber'),
      this.card('Protein', totals.protein, 'g', perHour.protein, 'g/h', 'teal'),
    ];
  });

  protected quantity(productId: ProductId): number {
    return this.quantities()[productId] ?? 0;
  }

  protected setRaceHours(value: string): void {
    this.raceHours.set(this.clampNumber(value, 0, 99));
  }

  protected setRaceMinutes(value: string): void {
    this.raceMinutes.set(this.clampNumber(value, 0, 59));
  }

  protected setTargetCarbsPerHour(value: string): void {
    this.targetCarbsPerHour.set(this.clampNumber(value, 0, 200));
  }

  protected setQuantity(productId: ProductId, value: string | number): void {
    const nextQuantity = this.roundToQuarter(this.clampNumber(String(value), 0, 99));

    this.quantities.update((quantities) => ({
      ...quantities,
      [productId]: nextQuantity,
    }));
  }

  protected resetPlan(): void {
    this.quantities.set(this.productService.createEmptyQuantities());
  }

  protected productTotal(product: FuelProduct, metric: keyof Nutrition): number {
    return product.nutrition[metric] * this.quantity(product.id);
  }

  protected format(value: number, unit = '', maximumFractionDigits = 0): string {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits,
      minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    }).format(value);

    return unit ? `${formatted} ${unit}` : formatted;
  }

  protected carbTargetDeltaLabel(): string {
    const delta = this.carbTarget().delta;

    if (delta >= 0) {
      return `${this.format(delta, 'g', 1)} above target`;
    }

    return `${this.format(delta * -1, 'g', 1)} remaining`;
  }

  private card(
    label: string,
    value: number,
    unit: string,
    perHourValue: number,
    perHourUnit: string,
    tone: string,
  ): TotalCard {
    return {
      label,
      value: this.format(value, unit, unit === 'kcal' || unit === 'mg' ? 0 : 1),
      perHour: this.format(
        perHourValue,
        perHourUnit,
        perHourUnit.includes('kcal') || perHourUnit.includes('mg') ? 0 : 1,
      ),
      tone,
    };
  }

  private addNutrition(total: Nutrition, nutrition: Nutrition, multiplier: number): Nutrition {
    return {
      calories: total.calories + nutrition.calories * multiplier,
      carbs: total.carbs + nutrition.carbs * multiplier,
      sugar: total.sugar + nutrition.sugar * multiplier,
      fiber: total.fiber + nutrition.fiber * multiplier,
      fat: total.fat + nutrition.fat * multiplier,
      protein: total.protein + nutrition.protein * multiplier,
      sodium: total.sodium + nutrition.sodium * multiplier,
      caffeine: total.caffeine + nutrition.caffeine * multiplier,
      salt: total.salt + nutrition.salt * multiplier,
      potassium: total.potassium + nutrition.potassium * multiplier,
      magnesium: total.magnesium + nutrition.magnesium * multiplier,
      calcium: total.calcium + nutrition.calcium * multiplier,
    };
  }

  private scaleNutrition(nutrition: Nutrition, multiplier: number): Nutrition {
    return {
      calories: nutrition.calories * multiplier,
      carbs: nutrition.carbs * multiplier,
      sugar: nutrition.sugar * multiplier,
      fiber: nutrition.fiber * multiplier,
      fat: nutrition.fat * multiplier,
      protein: nutrition.protein * multiplier,
      sodium: nutrition.sodium * multiplier,
      caffeine: nutrition.caffeine * multiplier,
      salt: nutrition.salt * multiplier,
      potassium: nutrition.potassium * multiplier,
      magnesium: nutrition.magnesium * multiplier,
      calcium: nutrition.calcium * multiplier,
    };
  }

  private clampNumber(value: string, min: number, max: number): number {
    const parsed = Number.parseFloat(value);

    if (Number.isNaN(parsed)) {
      return min;
    }

    return Math.min(max, Math.max(min, parsed));
  }

  private roundToQuarter(value: number): number {
    return Math.round(value * 4) / 4;
  }
}
