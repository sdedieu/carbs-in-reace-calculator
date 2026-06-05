import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FuelProduct, ProductKind } from '../product.model';
import { formatNutritionValue, NutritionValuePipe } from '../pipes/nutrition-value.pipe';

@Component({
  selector: 'app-product-library-card',
  imports: [NutritionValuePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="grid gap-3 rounded-lg border border-stone-900/10 bg-white p-4"
      data-test="product-card"
    >
      <div class="flex items-center justify-between gap-3">
        <span [class]="productKindBadgeClasses()">
          {{ product().kind }}
        </span>
        <a
          class="text-sm font-extrabold text-emerald-700 hover:underline"
          [href]="product().sourceUrl"
          target="_blank"
          rel="noopener"
        >
          {{ product().sourceLabel }}
        </a>
      </div>
      <h3 class="text-base font-black tracking-normal text-pretty">{{ product().name }}</h3>
      <p class="text-sm font-semibold text-stone-500">{{ product().serving }}</p>
      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Carbs</dt>
          <dd class="font-black">{{ product().nutrition.carbs | nutritionValue : 'g' : 1 }}</dd>
        </div>
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Calories</dt>
          <dd class="font-black">{{ product().nutrition.calories | nutritionValue : 'kcal' : 0 }}</dd>
        </div>
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Sugar</dt>
          <dd class="font-black">{{ product().nutrition.sugar | nutritionValue : 'g' : 1 }}</dd>
        </div>
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Fat</dt>
          <dd class="font-black">{{ product().nutrition.fat | nutritionValue : 'g' : 1 }}</dd>
        </div>
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Fiber</dt>
          <dd class="font-black">{{ product().nutrition.fiber | nutritionValue : 'g' : 1 }}</dd>
        </div>
        <div class="grid gap-1">
          <dt class="text-xs font-extrabold text-stone-500 uppercase">Protein</dt>
          <dd class="font-black">{{ product().nutrition.protein | nutritionValue :  'g' : 1 }}</dd>
        </div>
      </dl>
      <small class="text-sm font-semibold text-stone-500">{{ micronutrients() }}</small>
    </article>
  `,
})
export class ProductLibraryCardComponent {
  readonly product = input.required<FuelProduct>();

  protected micronutrients = computed(() => {
    const nutrition = this.product().nutrition;
    const entries = [
      nutrition.caffeine > 0 ? `${formatNutritionValue(nutrition.caffeine, 'mg')} caffeine` : '',
      nutrition.sodium > 0 ? `${formatNutritionValue(nutrition.sodium, 'mg')} sodium` : '',
      nutrition.potassium > 0 ? `${formatNutritionValue(nutrition.potassium, 'mg')} potassium` : '',
      nutrition.magnesium > 0 ? `${formatNutritionValue(nutrition.magnesium, 'mg', 1)} magnesium` : '',
      nutrition.calcium > 0 ? `${formatNutritionValue(nutrition.calcium, 'mg')} calcium` : '',
    ].filter(Boolean);

    return entries.join(' / ') || 'No notable extras';
  });

  protected productKindBadgeClasses = computed(() => {
    const base = 'rounded-full px-2.5 py-1 text-xs font-black uppercase';
    const classes: Record<ProductKind, string> = {
      drink: `${base} bg-blue-50 text-blue-700`,
      electrolyte: `${base} bg-teal-50 text-teal-700`,
      gel: `${base} bg-emerald-50 text-emerald-700`,
      jelly: `${base} bg-orange-50 text-orange-700`,
      puree: `${base} bg-rose-50 text-rose-700`,
      solid: `${base} bg-amber-50 text-amber-700`,
    };

    return classes[this.product().kind];
  });
}
