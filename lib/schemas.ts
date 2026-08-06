import { z } from "zod";
export const authSchema=z.object({email:z.string().email("Enter a valid email"),password:z.string().min(6,"Use at least 6 characters")});
export const registerSchema=authSchema.extend({name:z.string().min(2,"Enter your name")});
export const accountSchema=z.object({name:z.string().min(2).max(30),balance:z.coerce.number().nonnegative()});
export const tradeSchema=z.object({accountId:z.string().min(1,"Choose an account"),date:z.string().min(1),session:z.enum(["Asia","London","New York"]),symbol:z.string().min(2).max(12),position:z.enum(["Long","Short"]),risk:z.coerce.number().nonnegative(),rr:z.coerce.number(),pl:z.coerce.number(),lots:z.coerce.number().positive(),outcome:z.enum(["Win","Loss","Break even"]),entryTime:z.string(),exitTime:z.string(),emotion:z.string().max(100),preTrade:z.string().max(1000),postTrade:z.string().max(1000)});
