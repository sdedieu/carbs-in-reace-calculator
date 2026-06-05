import { Component, computed, inject, signal } from '@angular/core';
import { FuelProduct, Nutrition, ProductId, ProductKind, ProductQuantities } from './product.model';
import { EMPTY_NUTRITION, ProductService } from './product.service';

interface TotalCard {
  label: string;
  value: string;
  perHour: string;
  tone: string;
}

@Component({
  selector: 'app-root',
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
            <label class="grid gap-2 text-sm font-bold text-stone-600">
              <span>Hours</span>
              <input
                class="min-h-11 rounded-lg border border-stone-900/20 bg-white px-3 text-base font-extrabold text-stone-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
                data-test="race-hours"
                type="number"
                min="0"
                max="99"
                [value]="raceHours()"
                (input)="setRaceHours($any($event.target).value)"
              />
            </label>

            <label class="grid gap-2 text-sm font-bold text-stone-600">
              <span>Minutes</span>
              <input
                class="min-h-11 rounded-lg border border-stone-900/20 bg-white px-3 text-base font-extrabold text-stone-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
                data-test="race-minutes"
                type="number"
                min="0"
                max="59"
                [value]="raceMinutes()"
                (input)="setRaceMinutes($any($event.target).value)"
              />
            </label>

            <label class="grid gap-2 text-sm font-bold text-stone-600">
              <span>Carbs / h</span>
              <input
                class="min-h-11 rounded-lg border border-stone-900/20 bg-white px-3 text-base font-extrabold text-stone-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
                data-test="target-carbs"
                type="number"
                min="0"
                max="200"
                [value]="targetCarbsPerHour()"
                (input)="setTargetCarbsPerHour($any($event.target).value)"
              />
            </label>
          </div>

          <div [class]="targetPanelClasses()" data-test="carb-target">
            <div class="flex items-end justify-between gap-4">
              <span [class]="targetStateClasses()">
                {{ carbTarget().state }}
              </span>
              <strong class="text-lg whitespace-nowrap">
                {{ format(totals().carbs, 'g', 1) }} / {{ format(carbTarget().goal, 'g', 0) }}
              </strong>
            </div>
            <progress
              class="h-2 w-full overflow-hidden rounded-full accent-emerald-700"
              [class.accent-orange-600]="carbTarget().delta > 10"
              [value]="carbTarget().progress"
              max="100"
              aria-label="Carbohydrate target progress"
            ></progress>
            <small class="font-bold text-stone-600">
              @if (carbTarget().delta >= 0) {
                {{ format(carbTarget().delta, 'g', 1) }} above target
              } @else {
                {{ format(carbTarget().delta * -1, 'g', 1) }} remaining
              }
            </small>
          </div>
        </section>

        <section
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
          aria-label="Nutrition totals"
          data-test="nutrition-totals"
        >
          @for (card of totalCards(); track card.label) {
            <article [class]="summaryCardClasses(card.tone)" data-test="summary-card">
              <span class="text-xs font-extrabold text-stone-500 uppercase">{{ card.label }}</span>
              <strong class="text-2xl leading-none font-black">{{ card.value }}</strong>
              <small class="font-bold text-stone-500">{{ card.perHour }}</small>
            </article>
          }
        </section>

        <section
          class="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]"
        >
          <section
            class="rounded-lg border border-stone-900/10 bg-white/90 p-4 shadow-xl shadow-stone-900/5 lg:p-5"
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
              class="grid gap-2"
              role="table"
              aria-label="Product quantities and calculated totals"
            >
              <div
                class="hidden grid-cols-[minmax(280px,1.6fr)_170px_repeat(3,minmax(82px,0.55fr))] gap-3 px-3 pb-1 text-xs font-black text-stone-500 uppercase lg:grid"
                role="row"
              >
                <span role="columnheader">Product</span>
                <span role="columnheader">Qty</span>
                <span role="columnheader">Carbs</span>
                <span role="columnheader">Calories</span>
                <span role="columnheader">Sugar</span>
              </div>

              @for (product of products; track product.id) {
                <article
                  class="grid min-h-16 gap-3 rounded-lg border border-stone-900/10 bg-white p-3 lg:grid-cols-[minmax(280px,1.6fr)_170px_repeat(3,minmax(82px,0.55fr))] lg:items-center"
                  role="row"
                  data-test="plan-row"
                >
                  <div class="grid grid-cols-[14px_minmax(0,1fr)] items-center gap-3" role="cell">
                    <span [class]="productKindClasses(product.kind)" aria-hidden="true"></span>
                    <div>
                      <strong class="block [overflow-wrap:anywhere]">{{ product.name }}</strong>
                      <small class="text-sm font-semibold text-stone-500">
                        {{ product.brand }} / {{ product.serving }}
                      </small>
                    </div>
                  </div>

                  <div
                    class="grid max-w-56 grid-cols-[40px_minmax(62px,1fr)_40px] gap-1.5"
                    role="cell"
                  >
                    <button
                      class="min-h-10 rounded-lg border border-stone-900/15 bg-white font-black text-stone-900 hover:border-emerald-700/45 hover:bg-emerald-50"
                      data-test="decrease-quantity"
                      type="button"
                      (click)="adjustQuantity(product.id, -0.5)"
                      [attr.aria-label]="'Reduce ' + product.name"
                    >
                      -
                    </button>
                    <input
                      class="min-h-10 rounded-lg border border-stone-900/20 bg-white px-1.5 text-center font-extrabold text-stone-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
                      data-test="quantity-input"
                      type="number"
                      min="0"
                      max="99"
                      step="0.25"
                      [value]="quantity(product.id)"
                      (input)="setQuantity(product.id, $any($event.target).value)"
                      [attr.aria-label]="product.name + ' quantity'"
                    />
                    <button
                      class="min-h-10 rounded-lg border border-stone-900/15 bg-white font-black text-stone-900 hover:border-emerald-700/45 hover:bg-emerald-50"
                      data-test="increase-quantity"
                      type="button"
                      (click)="adjustQuantity(product.id, 0.5)"
                      [attr.aria-label]="'Increase ' + product.name"
                    >
                      +
                    </button>
                  </div>

                  <span class="font-extrabold" role="cell">
                    {{ format(productTotal(product, 'carbs'), 'g', 1) }}
                  </span>
                  <span class="font-extrabold" role="cell">
                    {{ format(productTotal(product, 'calories'), 'kcal', 0) }}
                  </span>
                  <span class="font-extrabold" role="cell">
                    {{ format(productTotal(product, 'sugar'), 'g', 1) }}
                  </span>
                </article>
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
                <article
                  class="grid gap-3 rounded-lg border border-stone-900/10 bg-white p-4"
                  data-test="product-card"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span [class]="productKindBadgeClasses(product.kind)">
                      {{ product.kind }}
                    </span>
                    <a
                      class="text-sm font-extrabold text-emerald-700 hover:underline"
                      [href]="product.sourceUrl"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ product.sourceLabel }}
                    </a>
                  </div>
                  <h3 class="text-base font-black tracking-normal text-pretty">
                    {{ product.name }}
                  </h3>
                  <p class="text-sm font-semibold text-stone-500">{{ product.serving }}</p>
                  <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Carbs</dt>
                      <dd class="font-black">{{ format(product.nutrition.carbs, 'g', 1) }}</dd>
                    </div>
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Calories</dt>
                      <dd class="font-black">
                        {{ format(product.nutrition.calories, 'kcal', 0) }}
                      </dd>
                    </div>
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Sugar</dt>
                      <dd class="font-black">{{ format(product.nutrition.sugar, 'g', 1) }}</dd>
                    </div>
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Fat</dt>
                      <dd class="font-black">{{ format(product.nutrition.fat, 'g', 1) }}</dd>
                    </div>
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Fiber</dt>
                      <dd class="font-black">{{ format(product.nutrition.fiber, 'g', 1) }}</dd>
                    </div>
                    <div class="grid gap-1">
                      <dt class="text-xs font-extrabold text-stone-500 uppercase">Protein</dt>
                      <dd class="font-black">{{ format(product.nutrition.protein, 'g', 1) }}</dd>
                    </div>
                  </dl>
                  <small class="text-sm font-semibold text-stone-500">{{
                    micronutrients(product)
                  }}</small>
                </article>
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

  protected adjustQuantity(productId: ProductId, amount: number): void {
    this.setQuantity(productId, this.quantity(productId) + amount);
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

  protected micronutrients(product: FuelProduct): string {
    const entries = [
      product.nutrition.caffeine > 0
        ? `${this.format(product.nutrition.caffeine, 'mg')} caffeine`
        : '',
      product.nutrition.sodium > 0 ? `${this.format(product.nutrition.sodium, 'mg')} sodium` : '',
      product.nutrition.potassium > 0
        ? `${this.format(product.nutrition.potassium, 'mg')} potassium`
        : '',
      product.nutrition.magnesium > 0
        ? `${this.format(product.nutrition.magnesium, 'mg', 1)} magnesium`
        : '',
      product.nutrition.calcium > 0
        ? `${this.format(product.nutrition.calcium, 'mg')} calcium`
        : '',
    ].filter(Boolean);

    return entries.join(' / ') || 'No notable extras';
  }

  protected targetPanelClasses(): string {
    const base = 'grid gap-3 rounded-lg border p-4';

    return this.carbTarget().delta > 10
      ? `${base} border-orange-500/30 bg-orange-50`
      : `${base} border-emerald-700/20 bg-emerald-50`;
  }

  protected targetStateClasses(): string {
    const base = 'text-xs font-black tracking-wide uppercase';

    return this.carbTarget().delta > 10 ? `${base} text-orange-700` : `${base} text-emerald-700`;
  }

  protected summaryCardClasses(tone: string): string {
    const base =
      'grid min-h-28 content-between gap-3 rounded-lg border border-stone-900/10 bg-white p-4 shadow-sm border-t-4';
    const classes: Record<string, string> = {
      amber: `${base} border-t-amber-500`,
      blue: `${base} border-t-blue-600`,
      charcoal: `${base} border-t-stone-900`,
      green: `${base} border-t-emerald-700`,
      lime: `${base} border-t-lime-600`,
      orange: `${base} border-t-orange-500`,
      rose: `${base} border-t-rose-600`,
      teal: `${base} border-t-teal-600`,
    };

    return classes[tone] ?? classes['green'];
  }

  protected productKindClasses(kind: ProductKind): string {
    const base = 'h-11 w-3.5 rounded-full';
    const classes: Record<ProductKind, string> = {
      drink: `${base} bg-blue-600`,
      electrolyte: `${base} bg-teal-600`,
      gel: `${base} bg-emerald-700`,
      jelly: `${base} bg-orange-500`,
      puree: `${base} bg-rose-600`,
      solid: `${base} bg-amber-500`,
    };

    return classes[kind];
  }

  protected productKindBadgeClasses(kind: ProductKind): string {
    const base = 'rounded-full px-2.5 py-1 text-xs font-black uppercase';
    const classes: Record<ProductKind, string> = {
      drink: `${base} bg-blue-50 text-blue-700`,
      electrolyte: `${base} bg-teal-50 text-teal-700`,
      gel: `${base} bg-emerald-50 text-emerald-700`,
      jelly: `${base} bg-orange-50 text-orange-700`,
      puree: `${base} bg-rose-50 text-rose-700`,
      solid: `${base} bg-amber-50 text-amber-700`,
    };

    return classes[kind];
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
