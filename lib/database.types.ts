
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "events": {
                  Row: {
                    "created_at": string,"id": number,"product_id": string | null,"source": string,"store_id": string,"type": Database["public"]['Enums']["event_type"],"visitor_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"product_id"?: string | null,"source"?: string,"store_id": string,"type": Database["public"]['Enums']["event_type"],"visitor_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"product_id"?: string | null,"source"?: string,"store_id"?: string,"type"?: Database["public"]['Enums']["event_type"],"visitor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"product_categories": {
                  Row: {
                    "id": string,"name": string,"sort_order": number,"store_id": string
                  }
                  Insert: {
                    "id"?: string,"name": string,"sort_order"?: number,"store_id": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"sort_order"?: number,"store_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_categories_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "id": string,"position": number,"product_id": string,"url": string
                  }
                  Insert: {
                    "id"?: string,"position"?: number,"product_id": string,"url": string
                  }
                  Update: {
                    "id"?: string,"position"?: number,"product_id"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"created_at": string,"description": string | null,"id": string,"is_unique": boolean,"name": string,"price": number,"sale_price": number | null,"sort_order": number,"status": Database["public"]['Enums']["product_status"],"stock": number | null,"store_id": string,"updated_at": string
                  }
                  Insert: {
                    "category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_unique"?: boolean,"name": string,"price": number,"sale_price"?: number | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["product_status"],"stock"?: number | null,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_unique"?: boolean,"name"?: string,"price"?: number,"sale_price"?: number | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["product_status"],"stock"?: number | null,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "product_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string | null,"id": string,"product_id": string | null,"reason": string,"resolved": boolean,"store_id": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"product_id"?: string | null,"reason": string,"resolved"?: boolean,"store_id": string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"id"?: string,"product_id"?: string | null,"reason"?: string,"resolved"?: boolean,"store_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"sales": {
                  Row: {
                    "created_at": string,"id": string,"product_id": string | null,"product_name": string,"quantity": number,"store_id": string,"unit_price": number
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"product_id"?: string | null,"product_name": string,"quantity": number,"store_id": string,"unit_price": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"store_id"?: string,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sales_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sales_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"store_categories": {
                  Row: {
                    "id": string,"name": string,"slug": string
                  }
                  Insert: {
                    "id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stores": {
                  Row: {
                    "address": string | null,"banner_url": string | null,"category_id": string | null,"city": string | null,"created_at": string,"description": string | null,"featured": boolean,"id": string,"logo_url": string | null,"name": string,"offers_delivery": boolean,"offers_pickup": boolean,"owner_id": string,"payment_methods": (string)[],"schedule": Json | null,"slug": string,"status": Database["public"]['Enums']["store_status"],"updated_at": string,"whatsapp": string
                  }
                  Insert: {
                    "address"?: string | null,"banner_url"?: string | null,"category_id"?: string | null,"city"?: string | null,"created_at"?: string,"description"?: string | null,"featured"?: boolean,"id"?: string,"logo_url"?: string | null,"name": string,"offers_delivery"?: boolean,"offers_pickup"?: boolean,"owner_id": string,"payment_methods"?: (string)[],"schedule"?: Json | null,"slug": string,"status"?: Database["public"]['Enums']["store_status"],"updated_at"?: string,"whatsapp": string
                  }
                  Update: {
                    "address"?: string | null,"banner_url"?: string | null,"category_id"?: string | null,"city"?: string | null,"created_at"?: string,"description"?: string | null,"featured"?: boolean,"id"?: string,"logo_url"?: string | null,"name"?: string,"offers_delivery"?: boolean,"offers_pickup"?: boolean,"owner_id"?: string,"payment_methods"?: (string)[],"schedule"?: Json | null,"slug"?: string,"status"?: Database["public"]['Enums']["store_status"],"updated_at"?: string,"whatsapp"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stores_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "store_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stores_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_stores":
{ Args: Record<PropertyKey, never>; Returns: {
              "city": string,"created_at": string,"featured": boolean,"id": string,"name": string,"products": number,"slug": string,"status": Database["public"]['Enums']["store_status"],"visits_30d": number
            }[]
                           },
"can_see_store":
{ Args: { "p_store_id": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_my_store_folder":
{ Args: { "p_name": string }; Returns: boolean
                           },
"mark_product_sold":
{ Args: { "p_product_id": string,"p_quantity"?: number }; Returns: undefined
                           },
"owns_store":
{ Args: { "p_store_id": string }; Returns: boolean
                           },
"product_store_id":
{ Args: { "p_product_id": string }; Returns: string
                           },
"stats_by_day":
{ Args: { "p_days"?: number,"p_store_id": string }; Returns: {
              "day": string,"order_clicks": number,"visitors": number
            }[]
                           },
"stats_sales_by_month":
{ Args: { "p_months"?: number,"p_store_id": string }; Returns: {
              "month": string,"revenue": number,"units": number
            }[]
                           },
"stats_top_products":
{ Args: { "p_days"?: number,"p_store_id": string }; Returns: {
              "in_orders": number,"name": string,"product_id": string,"views": number
            }[]
                           },
"store_summary":
{ Args: { "p_store_id": string }; Returns: Json
                           },
"track_event":
{ Args: { "p_product_id"?: string,"p_source"?: string,"p_store_id": string,"p_type": Database["public"]['Enums']["event_type"],"p_visitor_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "event_type": "visita_tienda"|"visita_producto"|"clic_pedir"|"producto_en_pedido","product_status": "disponible"|"agotado"|"vendido","store_status": "pendiente"|"activa"|"suspendida","user_role": "vendedor"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "event_type": ["visita_tienda", "visita_producto", "clic_pedir", "producto_en_pedido"],"product_status": ["disponible", "agotado", "vendido"],"store_status": ["pendiente", "activa", "suspendida"],"user_role": ["vendedor", "admin"]
          }
        }
} as const
