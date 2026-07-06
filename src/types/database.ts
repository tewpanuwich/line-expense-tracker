export type ExpenseSource = "manual" | "ocr";

// Row shapes must be `type` aliases, not `interface` — Supabase's generic
// query-builder types fail to resolve (silently collapsing to `never`) when
// given interfaces here under strictNullChecks.
export type FamilyMember = {
  id: string;
  name: string;
  avatar_icon: string | null;
  pin_hash: string | null;
  is_admin: boolean;
  setup_token: string | null;
  setup_token_expires_at: string | null;
  has_setup: boolean;
  created_at: string;
  line_user_id: string | null;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
};

export type Receipt = {
  id: string;
  member_id: string;
  merchant_name: string | null;
  purchase_date: string;
  total_amount: number | null;
  source: ExpenseSource;
  created_at: string;
};

export type ExpenseItem = {
  id: string;
  receipt_id: string;
  category_id: string | null;
  item_name: string;
  amount: number;
  quantity: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      family_members: {
        Row: FamilyMember;
        Insert: Partial<FamilyMember> & { name: string };
        Update: Partial<FamilyMember>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name: string };
        Update: Partial<Category>;
        Relationships: [];
      };
      receipts: {
        Row: Receipt;
        Insert: Partial<Receipt> & { member_id: string; purchase_date: string };
        Update: Partial<Receipt>;
        Relationships: [];
      };
      expense_items: {
        Row: ExpenseItem;
        Insert: Partial<ExpenseItem> & {
          receipt_id: string;
          item_name: string;
          amount: number;
        };
        Update: Partial<ExpenseItem>;
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
  };
};
