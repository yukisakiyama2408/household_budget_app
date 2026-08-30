export type TransactionType = "income" | "expense";
export type PayMethod = "Credit" | "Cash";
export type CategoryType = "income" | "expense" | "both";
export type FeatureRequestStatus = "検討中" | "次に対応" | "対応済み";
export type FeatureRequestCategory = "収支入力" | "予算" | "分析" | "通知" | "インポート" | "設定" | "その他";
export type AnalysisView = "monthly" | "weekly" | "yearly";
export type GoalType = "savings" | "expense";

export type Goal = {
  id: number;
  title: string;
  type: GoalType;
  target_amount: number;
  deadline: string | null;
  category_id: number | null;
  start_balance: number;
  saved_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AnalysisAdvice = {
  id: number;
  analysis_result_id: number;
  content: string;
  is_completed: boolean;
  display_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalysisResult = {
  id: number;
  title: string;
  content: string;
  analysis_view: AnalysisView;
  period_label: string;
  date_from: string;
  date_to: string;
  created_at: string;
  updated_at: string;
};

export type AnalysisResultWithAdvices = AnalysisResult & {
  analysis_advices: AnalysisAdvice[];
};

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  color: string | null;
  display_order: number;
  offset_category_id: number | null;
};

export type Transaction = {
  id: number;
  date: string;
  content: string;
  category_id: number | null;
  amount: number;
  type: TransactionType;
  pay_method: PayMethod | null;
  store: string | null;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  categories: Category | null;
};

export type CreditSettlement = {
  id: number;
  year: number;
  month: number;
  amount: number;
  settlement_date: string;
};

export type Budget = {
  id: number;
  year: number;
  month: number;
  category_id: number;
  amount: number;
};

export type BudgetWithCategory = Budget & {
  categories: Category;
};

export type FixedExpense = {
  id: number;
  name: string;
  amount: number;
  type: string;
  category_id: number | null;
  pay_method: string | null;
  store: string | null;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
};

export type FixedExpenseLog = {
  id: number;
  fixed_expense_id: number;
  year: number;
  month: number;
  transaction_id: number | null;
  applied_at: string;
};

export type FeatureRequest = {
  id: number;
  title: string;
  detail: string;
  category: FeatureRequestCategory;
  status: FeatureRequestStatus;
  votes: number;
  comments_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id">;
        Update: Partial<Omit<Category, "id">>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
        Relationships: [];
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, "id">;
        Update: Partial<Omit<Budget, "id">>;
        Relationships: [];
      };
      feature_requests: {
        Row: FeatureRequest;
        Insert: Omit<FeatureRequest, "id" | "created_at" | "updated_at" | "comments_count"> & {
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FeatureRequest, "id" | "created_at">>;
        Relationships: [];
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, "id" | "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Goal, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "goals_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_results: {
        Row: AnalysisResult;
        Insert: Omit<AnalysisResult, "id" | "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AnalysisResult, "id" | "created_at">>;
        Relationships: [];
      };
      analysis_advices: {
        Row: AnalysisAdvice;
        Insert: Omit<AnalysisAdvice, "id" | "created_at" | "updated_at" | "completed_at"> & {
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AnalysisAdvice, "id" | "analysis_result_id" | "created_at">>;
        Relationships: [];
      };
    };
  };
};
