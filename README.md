# Finance service

## Deploy Tiger beetle
1) Create data folder
```
  docker run --security-opt seccomp=unconfined \
     -v $(pwd)/data:/data ghcr.io/tigerbeetle/tigerbeetle \
    format --cluster=0 --replica=0 --replica-count=1 /data/0_0.tigerbeetle
```
2) Start tiger beetle from docker
```
docker run -it --security-opt seccomp=unconfined \
    -p 3000:3000 -v $(pwd)/data:/data ghcr.io/tigerbeetle/tigerbeetle \
    start --addresses=0.0.0.0:3000 /data/0_0.tigerbeetle
```


## Run
1) bun install
2) Add TB_HOSTS in .env. Example: 0.0.0.0:3000,...
3) bun run start:dev


## Функциональные требования
1) Сервис должен быть реализован абстрактно, чтобы в дальнейшем можно было добавить новые провайдеры
2) Для начала должна быть реализована интеграция с payadmit, m-peso
3) Метод генерации ссылки на оплату
4) Обработка вебхука от провайдеров


## Реализация
  ```ts
  // Нужно будет соотносить методы оплаты на площадке с нашими
  // чтобы все методы сходились в одни значения enum
  enum PaymentTypeEnum { QR = 'QR', ... }
  // T - кастомные поля для платформы и типа платежа
	export class Payment<T> {
      type: PaymentTypeEnum;
      providerType: 'PAYADMIT' | 'MPESO';
      amount: number; 
      userId: string; // ID пользователя в нашей системе
      currencyId: string; // id валюты в нашей таблице
      paymentType: PaymentTypeEnum;
      // TODO: Добавить кастомную реализацию для разных типов платежа.
      data: T;
	}
  ```

### POST /payments
  ```ts
	export class CreatePayment {
      providerType: 'PAYADMIT' | 'MPESO';
      amount: number;
      currencyId: string; // id валюты в нашей таблице
      paymentType: PaymentTypeEnum //
      data: any;
	}

	export class CreatePayadmitPayment extends CreatePayment {
    providerType: 'PAYADMIT';
    data: {
      ...
    }
  }
  ```
  
### POST /webhook/:providerTypeEnum 
реализовать Pipe который парсит в ProviderEnum иначе кидает ошибку
  ```ts
   // Для каждой площадки свой класс вебхука
   export class WebhookDto {}

   /**
 * Детали платежного метода
 */
export class PaymentMethodDetails extends WebhookDto {
  /** Номер карты (частично маскированный) */
  customerAccountNumber: string;
  
  /** Имя держателя карты */
  cardholderName: string;
  
  /** Месяц истечения срока карты */
  cardExpiryMonth: string;
  
  /** Год истечения срока карты */
  cardExpiryYear: string;
  
  /** Бренд карты (VISA, MASTERCARD и т.д.) */
  cardBrand: string;
  
  /** Страна эмитент карты */
  cardIssuingCountry: string;
  
  /** Банк-эмитент карты */
  cardBank: string;
}

/**
 * Внешние ссылки платежа
 */
class ExternalReferences {
  /** ID заказа в мерчант системе */
  orderId?: number;
  
  // Можно добавить другие внешние идентификаторы по мере необходимости
}

/**
 * Информация о клиенте
 */
class CustomerInfo {
  /** Внутренний ID клиента в системе мерчанта */
  referenceId: string;
  
  /** Страна гражданства (ISO код) */
  citizenshipCountryCode: string;
  
  /** Имя клиента */
  firstName: string;
  
  /** Фамилия клиента */
  lastName: string;
  
  /** Дата рождения (YYYY-MM-DD) */
  dateOfBirth: string;
  
  /** Email клиента */
  email: string;
  
  /** Телефон клиента */
  phone: string;
  
  /** Локаль клиента */
  locale: string;
  
  /** IP адрес клиента */
  ip: string;
  
  /** Группа маршрутизации */
  routingGroup?: string;
  
  /** Статус KYC */
  kycStatus: boolean;
  
  /** Статус KYC платежного инструмента */
  paymentInstrumentKycStatus: boolean;
  
  /** Дата первого депозита */
  dateOfFirstDeposit?: string;
  
  /** Общая сумма депозитов */
  depositsAmount?: number;
  
  /** Общая сумма выводов */
  withdrawalsAmount?: number;
  
  /** Количество депозитов */
  depositsCnt?: number;
  
  /** Количество выводов */
  withdrawalsCnt?: number;
  
  /** Уровень доверия */
  trustLevel?: string;
  
  /** Флаг btag */
  btag?: boolean;
  
  /** Аффилированность */
  affiliated?: string;
}

/**
 * Адрес плательщика
 */
class BillingAddress {
  /** Адрес строка 1 */
  addressLine1: string;
  
  /** Адрес строка 2 */
  addressLine2?: string;
  
  /** Город */
  city: string;
  
  /** Код страны (ISO) */
  countryCode: string;
  
  /** Почтовый индекс */
  postalCode: string;
  
  /** Штат/регион */
  state?: string;
}

export class PayadmitWebhookResponse {
  /** Уникальный ID платежа в системе Payadmit */
  id: string;
  
  /** Референс ID платежа в системе мерчанта */
  referenceId: string;
  
  /** Тип платежа (DEPOSIT, WITHDRAWAL и т.д.) */
  paymentType: 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND';
  
  /** Статус платежа */
  state: 'COMPLETED' | 'PENDING' | 'FAILED' | 'CANCELLED';
  
  /** Описание платежа */
  description?: string;
  
  /** ID родительского платежа (для рекуррентных/возвратов) */
  parentPaymentId?: string;
  
  /** Метод платежа */
  paymentMethod: string;
  
  /** Детали платежного метода */
  paymentMethodDetails: PaymentMethodDetails;
  
  /** Сумма платежа */
  amount: number;
  
  /** Валюта платежа (ISO код) */
  currency: string;
  
  /** Сумма для клиента (если была конвертация) */
  customerAmount?: number;
  
  /** Валюта клиента (ISO код) */
  customerCurrency?: string;
  
  /** URL для редиректа */
  redirectUrl?: string;
  
  /** Код ошибки (если есть) */
  errorCode?: string;
  
  /** Внешний код результата */
  externalResultCode?: string;
  
  /** Внешние ссылки */
  externalRefs?: ExternalReferences;
  
  /** Информация о клиенте */
  customer: CustomerInfo;
  
  /** Адрес плательщика */
  billingAddress: BillingAddress;
  
  /** Флаг начала рекуррентных платежей */
  startRecurring?: boolean;
  
  /** Токен для рекуррентных платежей */
  recurringToken?: string;
  
  /** Название терминала */
  terminalName?: string;
}
  ```
  
### Провайдеры
Каждый провайдер будет реализовывать интерфейс IFinanceProvider и инжектироваться в PaymentService в виде Record<ProviderType, IProvider>
  ```ts
  // Адаптер взаимодействия с определенной платформой
	interface IProvider {
  type: ProviderTypeEnum;
  
  // Обработка вебхука
  handleWebhook(data: WebhookDto): Promise<{success: boolean, payment: Payment}>;
  
  // Генерация платежной ссылки
  generatePaymentUrl(dto: CreatePayment): Promise<string>;
  
  // Создание платежа
  createPayment(dto: CreatePayment): Promise<Payment>;
  
  // Возврат средств
  createRefund(dto: CreateRefund): Promise<Payment>;
  
  // Получение списка платежей
  getPayments(pagination: PaginationDto): Promise<Payment[]>;
  
  // Проверка статуса платежа
  checkPaymentStatus(paymentId: string): Promise<Payment>;
}


class PaymentService {
  constructor(
    private providers: Record<ProviderType, IProvider>,
    private balanceService: BalanceService,
    private paymentRepository: PaymentRepository
  ) {}

  async createPayment(dto: CreatePayment): Promise<PaymentLink> {
    // 1. Валидация данных
    // 2. Создание записи о платеже
    // 3. Делегирование генерации ссылки провайдеру
    // 4. Возврат платежной ссылки
  }

  async processWebhook(provider: ProviderType, data: WebhookDto): Promise<void> {
    // 1. Верификация подписи
    // 2. Обработка через провайдера
    // 3. Обновление статуса платежа
    // 4. Для успешных платежей - обновление баланса
  }

  async createRefund(dto: CreateRefund): Promise<RefundResult> {
    // 1. Проверка оригинального платежа
    // 2. Валидация суммы возврата
    // 3. Инициация возврата через провайдера
    // 4. Обновление баланса при успехе
  }
}
  ```
