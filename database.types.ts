import { MergeDeep } from "type-fest"
import { Database as DatabaseGenerated } from "./database-generated.types"
export type { Json } from "./database-generated.types"

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        lifetime: {
          Row: {
            userId: string
          }
        }
      }
    }
  }
>
