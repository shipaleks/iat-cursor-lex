import random
import re

# --- Константы (Аналогично TypeScript) ---
VOWELS_RU = "аеёиоуыэюя"
CONSONANTS_RU = "бвгджзйклмнпрстфхцчшщ"
ALL_LETTERS_RU = VOWELS_RU + CONSONANTS_RU

VOWELS_SET = set(VOWELS_RU)
CONSONANTS_SET = set(CONSONANTS_RU)

# Запрещенные кластеры (Пример, можно дополнять)
FORBIDDEN_CLUSTERS = [
    'йь', 'йъ', 'ьй', 'ъй', 'ъь', 'ьъ',
    'ыы', 'эы', 'яы', 'юы', 'иы',
    'цщ', 'щц', 'чч', 'шш', 'жж', 'щщ',
    # Добавьте другие по необходимости
    'бгд', 'птк', 'жзд', 'шст', # Пример труднопроизносимых
    'аь', 'оь', 'уь', 'эь', # Мягкий знак после некоторых гласных
    'аъ', 'оъ', 'уъ', 'эъ', # Твердый знак после некоторых гласных
    # Добавляем по результатам анализа:
    'гт', # Нетипичное сочетание звонкого и глухого
    'бьн',
    'ийе', # Редкое/нехарактерное сочетание
    'тт', # Нежелательное сдвоенное согласное
    'сй', 'зй' # Нетипичные сочетания
];

# Разрешенные начальные двухсогласные сочетания (для ужесточения проверки)
# Источник: Комбинация знаний и примеров, может требовать доработки
ALLOWED_INITIAL_CONSONANT_CLUSTERS = set([
    'бл', 'бр', 'вз', 'вл', 'вн', 'вр', 'вс', 'вш', 'гл', 'гн', 'гр', 
    'дв', 'др', 'жг', 'жд', 'жм', 'жн', 'зв', 'зд', 'зл', 'зм', 'зн', 
    'кл', 'кн', 'кр', 'кс', 'кт', 'мг', 'мл', 'мн', 'мр', 'мч', 'мш', 
    'нр', 'нз', 'пл', 'пр', 'пс', 'пт', 'рж', 'рз', 'рт', 'св', 'сг', 
    'зд', 'зг', 'ск', 'сл', 'см', 'сн', 'сп', 'ст', 'сф', 'сх', 'сц', 
    'тв', 'тк', 'тл', 'тм', 'тн', 'тр', 'тщ', 'хв', 'хл', 'хм', 'хр', 
    'цв', 'цм', 'цн', 'чв', 'чк', 'чл', 'чм', 'шв', 'шк', 'шл', 'шм', 
    'шн', 'шп', 'шт', 'щн' 
])

# --- Списки слов (ВАЖНО: Заполните своими данными!) ---

# Ваши целевые слова (для проверки, чтобы случайно не сгенерировать их)
AESTHETIC_WORDS_EXAMPLE = [
    "красиво", "прекрасно", "чудесно", "мило", "изящно", "свежо", 
    "восхитительно", "привлекательно", "приятно", "безобразно", "уродливо", 
    "отвратительно", "страшно", "дурно", "мерзко", "гадко", "неприятно", 
    "грубо", "ужасно", "ровно", "цельно", "складно", "стройно", "хаотично", 
    "коряво", "криво", "сумбурно", "точно", "чётко", "ясно", "неточно", 
    "мутно", "размыто", "живо", "сочно", "бойко", "бледно", "тускло", 
    "вяло", "скучно", "радостно", "тоскливо", "оригинально", "необычно", 
    "избито", "шаблонно"
]

# Внешний список похожих наречий (для базы мутаций и проверки)
EXTERNAL_SIMILAR_ADVERBS_EXAMPLE = [
    "ласково", "роскошно", "душевно", "тепло", "плавно", "бодро", 
    "пленительно", "манящее", "уютно", "зловеще", "противно", "жутко", 
    "скверно", "пошло", "низко", "мрачно", "резко", "дико", "плотно", 
    "прочно", "слитно", "стильно", "сбивчиво", "косо", "шатко", 
    "бессвязно", "метко", "чисто", "светло", "смутно", "рыхло", "ярко", 
    "густо", "резво", "тихо", "скудно", "сонно", "нудно", "весело", 
    "горько", "своеобразно", "нестандартно", "банально", "типично", 
    "звонко", "громко", "тонко", "сладко", "гладко", "крепко", "ловко", 
    "быстро", "медленно", "сильно", "слабо", "тяжело", "легко", "высоко", 
    "глубоко", "мелко", "широко", "узко", "долго", "кратко", "рано", 
    "поздно", "часто", "редко", "жидко", "полно", "пусто", "хмуро", 
    "жарко", "холодно", "сухо", "мокро", "твердо", "остро", "тупо", 
    "пышно", "скромно", "круто", "полого", "рельефно", "плоско", "прямо", 
    "близко", "далеко", "внятно", "невнятно", "громоздко", "компактно", 
    "однообразно", "разнообразно", "тесно", "просторно", "пестро", 
    "монотонно", "энергично", "вяловато", "экспрессивно", "сдержанно", 
    "выпукло", "впало", "подробно", "обобщенно", "конкретно", "абстрактно", 
    "академично", "популярно", "задорно", "уныло", "весомо", "легковесно", 
    "солидно", "хлипко", "обильно", "ритмично", "мелодично", "диссонансно", 
    "гармонично", "дисгармонично", "несуразно", "соразмерно", "динамично", 
    "статично", "подвижно", "неподвижно", "текуче", "застойно", "воздушно", 
    "тяжеловесно", "прозрачно", "мутновато", "колоритно", "блекло", 
    "устойчиво", "надежно", "ненадежно", "добротно", "халтурно", 
    "рационально", "нелогично", "последовательно", "непоследовательно", 
    "системно", "бессистемно", "многослойно", "примитивно", "сложно", 
    "линейно", "нелинейно", "спирально", "грустно", "смешно", "скорбно", 
    "буйно", "мирно", "бурно", "нежно", "грубовато", "люто", "мягонько", 
    "робко", "смело", "трусливо", "отважно", "заносчиво", "смирно", "гордо", 
    "униженно", "возвышенно", "мечтательно", "прагматично", "задумчиво", 
    "рассеянно", "внимательно", "небрежно", "аккуратно", "неряшливо", 
    "опрятно", "грязно", "стерильно", "загрязненно", "затхло", "ароматно", 
    "зловонно", "пахуче", "безвкусно", "вкусно", "пресно", "пикантно", 
    "пряно", "знойно", "прохладно", "морозно", "знобко", "палящее", 
    "матово", "глянцево", "шершаво", "ребристо", "волнисто", "зубчато", 
    "заостренно", "закругленно", "угловато", "обтекаемо", "ажурно", 
    "упруго", "вязко", "жестко", "гибко", "ломко", "пластично", "изогнуто", 
    "выпрямленно", "извилисто", "наклонно", "вертикально", "горизонтально", 
    "диагонально", "продольно", "поперечно", "параллельно", 
    "перпендикулярно", "радиально", "концентрично", "упорно", "настойчиво", 
    "уступчиво", "непреклонно", "податливо", "нестойко", "основательно", 
    "интенсивно", "экстенсивно", "распространенно"
]

# Создаем объединенное множество ВСЕХ реальных слов для быстрой проверки
ALL_REAL_WORDS_SET = set(w.lower() for w in AESTHETIC_WORDS_EXAMPLE) | \
                     set(w.lower() for w in EXTERNAL_SIMILAR_ADVERBS_EXAMPLE)

# --- Вспомогательные функции ---

def get_random_element(items):
    """Возвращает случайный элемент из списка или кортежа."""
    if not items:
        return None
    return random.choice(items)

# --- Функции Проверки и Мутации ---

def is_phonotactically_plausible(word):
    """
    Проверяет слово на базовую фонотактическую правдоподобность.
    (Упрощенная версия для экспериментов, можно усложнять)
    """
    word_lower = word.lower()
    n = len(word_lower)
    if n < 3: # Слишком короткие слова пропускаем
        return True

    # 1. Проверка на запрещенные кластеры
    if any(cluster in word_lower for cluster in FORBIDDEN_CLUSTERS):
        # print(f"    [Plausibility Fail] Forbidden cluster in: {word}")
        return False

    # 2. Проверка на длинные последовательности согласных/гласных
    max_consecutive_consonants = 0
    max_consecutive_vowels = 0
    current_consonants = 0
    current_vowels = 0
    for char in word_lower:
        if char in CONSONANTS_SET:
            current_consonants += 1
            current_vowels = 0
        elif char in VOWELS_SET:
            current_vowels += 1
            current_consonants = 0
        else: # Не буква - сбрасываем счетчики
             current_consonants = 0
             current_vowels = 0
        max_consecutive_consonants = max(max_consecutive_consonants, current_consonants)
        max_consecutive_vowels = max(max_consecutive_vowels, current_vowels)

    if max_consecutive_consonants > 3: # Максимум 3 согласных подряд
        # print(f"    [Plausibility Fail] Too many consonants ({max_consecutive_consonants}) in: {word}")
        return False
    if max_consecutive_vowels > 3: # Максимум 3 гласных подряд
        # print(f"    [Plausibility Fail] Too many vowels ({max_consecutive_vowels}) in: {word}")
        return False

    # 3. Проверка начала слова (например, не более 2 согласных)
    if n >= 2 and word_lower[0] in CONSONANTS_SET:
        if word_lower[1] in CONSONANTS_SET:
            # Две согласные в начале
            initial_cluster = word_lower[0:2]
            if initial_cluster not in ALLOWED_INITIAL_CONSONANT_CLUSTERS:
                # print(f"    [Plausibility Fail] Disallowed initial consonant cluster '{initial_cluster}' in: {word}")
                return False
            # Проверяем третью букву, если она есть
            if n >= 3 and word_lower[2] in CONSONANTS_SET:
                 # print(f"    [Plausibility Fail] Starts with 3+ consonants: {word}")
                 return False # Запрещаем 3 согласных в начале
        # else: # Первая согласная, вторая гласная - обычно нормально
             # pass 
    # Можно добавить специфичные запреты на ПЕРВУЮ букву (щ, ц и т.д.), если нужно
    # if word_lower.startswith(('щ', 'ц')): return False

    # 4. Проверка конца слова (например, запрет на 'й' или 'ь'+согласный)
    if word_lower.endswith('й'):
        # print(f"    [Plausibility Fail] Ends with 'й': {word}")
        return False
    if n >= 2 and word_lower.endswith('ь') and word_lower[-2] in CONSONANTS_SET:
        # print(f"    [Plausibility Fail] Ends with 'ь' + consonant: {word}")
        return False
    # Можно добавить другие запреты на окончания

    return True

def mutate_by_replacing_letter(word, real_words_set, debug=False):
    """
    Мутирует слово заменой ОДНОЙ ВНУТРЕННЕЙ буквы (не первой и не последней).
    Сохраняет тип буквы (гласная/согласная).
    Возвращает мутированное слово или None, если не удалось.
    """
    n = len(word)
    if n < 4: # Нужно минимум 4 буквы, чтобы была внутренняя для замены
        return None

    attempts = 10
    for _ in range(attempts):
        # Выбираем индекс ТОЛЬКО МЕЖДУ первой и последней: от 1 до n-2
        idx_to_mutate = random.randint(1, n - 2)
        original_char = word[idx_to_mutate]
        original_char_lower = original_char.lower()

        replacement_char = ''
        possible_replacements = []

        if original_char_lower in VOWELS_SET:
            possible_replacements = list(VOWELS_RU)
        elif original_char_lower in CONSONANTS_SET:
            possible_replacements = list(CONSONANTS_RU)
        else:
            continue # Не буква, пропускаем

        # Убираем оригинальную букву из замен
        possible_replacements = [c for c in possible_replacements if c != original_char_lower]
        if not possible_replacements:
            continue

        replacement_char = get_random_element(possible_replacements)

        # Сохраняем регистр, если нужно (хотя обычно работаем с lowercase)
        if original_char.isupper():
            replacement_char = replacement_char.upper()

        mutated_list = list(word)
        mutated_list[idx_to_mutate] = replacement_char
        mutated = "".join(mutated_list)

        # Проверки
        if (mutated.lower() != word.lower() and
                mutated.lower() not in real_words_set and
                is_phonotactically_plausible(mutated)):
            if debug: print(f"    [Replace OK] {word} -> {mutated}")
            return mutated

    if debug: print(f"    [Replace Fail] Could not mutate {word} by replacing")
    return None

def mutate_by_swapping_letters(word, real_words_set, force_consonants=False, force_vowels=False, debug=False):
    """
    Мутирует слово путем обмена ДВУХ букв (гласных или согласных).
    Поддерживает принудительный выбор только согласных или только гласных.
    Не трогает первую и последнюю буквы, защищает окончания -но/-во.
    Возвращает мутированное слово или None, если не удалось.
    """
    n = len(word)
    if n < 5:
        return None

    letters = list(word)
    indices = list(range(n))

    inner_indices = indices[1:-1]
    vowel_indices_all_inner = [idx for idx in inner_indices if letters[idx].lower() in VOWELS_SET]
    consonant_indices_all_inner = [idx for idx in inner_indices if letters[idx].lower() in CONSONANTS_SET]

    vowel_indices = vowel_indices_all_inner
    consonant_indices = consonant_indices_all_inner
    if word.endswith(('но', 'во')) and n >= 4:
        protected_index = n - 2
        vowel_indices = [idx for idx in vowel_indices_all_inner if idx != protected_index]
        consonant_indices = [idx for idx in consonant_indices_all_inner if idx != protected_index]
        # if debug: print(f"    [Swap Protect] Protecting ending '{word[-2:]}', excluding index {protected_index} from swap pools.")

    attempts = 10
    for _ in range(attempts):
        can_swap_vowels = len(vowel_indices) >= 2
        can_swap_consonants = len(consonant_indices) >= 2

        indices_to_swap_pool = None
        type_swapped = None

        # --- ИЗМЕНЕНИЕ: Логика выбора типа обмена с force_vowels ---
        if force_consonants:
            if can_swap_consonants:
                indices_to_swap_pool = consonant_indices
                type_swapped = 'consonant'
            else:
                continue
        elif force_vowels: # Новый флаг
            if can_swap_vowels:
                indices_to_swap_pool = vowel_indices
                type_swapped = 'vowel'
            else:
                continue
        # Стандартная логика (если ни один флаг не установлен)
        elif can_swap_vowels and can_swap_consonants:
            if random.random() < 0.5:
                indices_to_swap_pool = vowel_indices
                type_swapped = 'vowel'
            else:
                indices_to_swap_pool = consonant_indices
                type_swapped = 'consonant'
        elif can_swap_consonants:
            indices_to_swap_pool = consonant_indices
            type_swapped = 'consonant'
        elif can_swap_vowels:
             indices_to_swap_pool = vowel_indices
             type_swapped = 'vowel'
        else:
             continue

        if not indices_to_swap_pool: continue
        # --- КОНЕЦ ИЗМЕНЕНИЯ ---

        idx1 = get_random_element(indices_to_swap_pool)
        pool_without_idx1 = [idx for idx in indices_to_swap_pool if idx != idx1]
        if not pool_without_idx1: continue
        idx2 = get_random_element(pool_without_idx1)

        # Проверка на гласную между для СОГЛАСНЫХ
        if type_swapped == 'consonant':
            start_idx, end_idx = min(idx1, idx2), max(idx1, idx2)
            vowel_between = any(letters[k].lower() in VOWELS_SET for k in range(start_idx + 1, end_idx))
            if not vowel_between:
                # if debug: print(f"    [Swap Skip] Consonants at {idx1},{idx2} in '{word}' not separated by vowel.")
                continue

        mutated_list = list(letters)
        mutated_list[idx1], mutated_list[idx2] = mutated_list[idx2], mutated_list[idx1]
        mutated = "".join(mutated_list)

        if (mutated.lower() != word.lower() and
                mutated.lower() not in real_words_set and
                is_phonotactically_plausible(mutated)):
            if debug: print(f"    [Swap OK ({type_swapped})] {word} -> {mutated}")
            return mutated

    if debug:
        swap_type_str = "consonants" if force_consonants else "vowels" if force_vowels else "letters"
        print(f"    [Swap Fail] Could not mutate {word} by swapping {swap_type_str}")
    return None


# --- Основной Генератор Не-слов ---

def generate_non_word(base_word, external_adverbs, aesthetic_words, debug=False):
    """
    Генерирует не-слово, используя ТОЛЬКО обмен ГЛАСНЫХ.
    """
    if debug: print(f"\nGenerating non-word based on: '{base_word}' [VOWEL SWAP ONLY]")
    real_words_set = set(w.lower() for w in aesthetic_words) | \
                     set(w.lower() for w in external_adverbs)

    # --- Порядок Стратегий (Только Обмен Гласных) ---

    # 1. Мутация (ОБМЕН ГЛАСНЫХ) базового слова
    swapped_base = mutate_by_swapping_letters(base_word, real_words_set, force_vowels=True, debug=debug)
    if swapped_base:
        return swapped_base

    # 2. Мутация (ОБМЕН ГЛАСНЫХ) случайного ВНЕШНЕГО слова (если первое не удалось)
    if external_adverbs:
        attempts = 5 # Попробуем несколько внешних слов
        if debug: print(f"    [Swap Fallback] Base word swap failed. Trying {attempts} external words...")
        for i in range(attempts):
            external_base = get_random_element(external_adverbs)
            if debug: print(f"      Attempt {i+1}: Trying external '{external_base}'")
            # Избегаем мутации того же слова, если оно есть во внешнем списке
            if external_base.lower() == base_word.lower():
                 if debug: print("        Skipping external word identical to base word.")
                 continue
            swapped_external = mutate_by_swapping_letters(external_base, real_words_set, force_vowels=True, debug=debug)
            if swapped_external:
                if debug: print(f"    [Swap Fallback OK] Swapped external '{external_base}' -> '{swapped_external}'.")
                return swapped_external
        if debug: print(f"    [Swap Fallback Fail] Could not swap vowels in {attempts} external words.")


    # 3. Если ничего не сработало
    if debug: print("    [FAIL] Vowel swapping failed for base and external words.")
    return f"{base_word}_vowel_swap_failed" # Placeholder for failure


# --- Пример Использования ---
if __name__ == "__main__":
    print("--- Non-Word Generator Experiment ---")

    # Убедитесь, что списки слов выше заполнены!
    if not AESTHETIC_WORDS_EXAMPLE or not EXTERNAL_SIMILAR_ADVERBS_EXAMPLE:
        print("\n!!! ПОЖАЛУЙСТА, ЗАПОЛНИТЕ СПИСКИ СЛОВ В СКРИПТЕ !!!")
        print("AESTHETIC_WORDS_EXAMPLE и EXTERNAL_SIMILAR_ADVERBS_EXAMPLE")
        exit()

    print(f"\nUsing {len(AESTHETIC_WORDS_EXAMPLE)} aesthetic words and {len(EXTERNAL_SIMILAR_ADVERBS_EXAMPLE)} external adverbs.")
    print(f"Total known real words for checks: {len(ALL_REAL_WORDS_SET)}")

    num_examples = 50 # <--- Установлено 50 примеров
    generated_non_words = []
    debug_mode = False # Поставьте True для подробного лога генерации

    print(f"\nGenerating {num_examples} non-word examples using ONLY VOWEL SWAPPING...")

    for i in range(num_examples):
        # === Базовое слово по-прежнему из ВНЕШНЕГО списка ===
        base = get_random_element(EXTERNAL_SIMILAR_ADVERBS_EXAMPLE)
        if not base:
            print("Error: EXTERNAL_SIMILAR_ADVERBS_EXAMPLE is empty!")
            break 
            
        non_word = generate_non_word(
            base,
            EXTERNAL_SIMILAR_ADVERBS_EXAMPLE,
            AESTHETIC_WORDS_EXAMPLE,
            debug=debug_mode
        )
        generated_non_words.append(f"{i+1}. Base: '{base}' -> Non-word: '{non_word}'")

    print("\n--- Generated Examples (Vowel Swap Only) ---")
    for item in generated_non_words:
        print(item)

    print("\n--- Experimentation Tips ---")
    print("- Check the results. If many end with '_swap_failed', the constraints might be too tight or words too short.")
    print("- You might need to adjust 'is_phonotactically_plausible' or FORBIDDEN_CLUSTERS.")
    print("- Set debug_mode = True to investigate failures.")
    print("- To try other methods, revert changes in 'generate_non_word'.") 