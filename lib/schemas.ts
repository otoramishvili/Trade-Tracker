import { z } from "zod";
export const authSchema=z.object({email:z.string().email("Enter a valid email"),password:z.string().min(6,"Use at least 6 characters")});
export const registerSchema=authSchema.extend({name:z.string().min(2,"Enter your name")});
export const accountSchema=z.object({name:z.string().min(2).max(30),balance:z.coerce.number().nonnegative()});
export const tradeSchema=z.object({accountId:z.string().min(1,"Choose an account"),date:z.string().min(1),session:z.enum(["Asia","London","New York"]),symbol:z.string().min(2).max(12),position:z.enum(["Long","Short"]),risk:z.coerce.number().nonnegative(),rr:z.coerce.number(),pl:z.coerce.number(),lots:z.coerce.number().positive(),outcome:z.enum(["Win","Loss","Break even"]),entryTime:z.string(),exitTime:z.string(),emotion:z.string().max(100),preTrade:z.string().max(1000),postTrade:z.string().max(1000)});
export const onboardingSchema=z.object({
 traderStyles:z.array(z.enum(["Scalper","Day trader","Swing trader","Position trader","Investor"])).min(1,"Choose at least one style"),
 markets:z.array(z.enum(["Crypto","Forex","Futures","Stocks","Options"])).min(1,"Choose at least one market"),
 instruments:z.string().min(2,"Add at least one instrument"),
 experience:z.enum(["Beginner","Intermediate","Advanced","Professional"]),
 baseCurrency:z.enum(["USD","EUR","GBP","GEL"]),
 goal:z.enum(["Journal real trades","Paper trade","Track investments","Improve discipline"]),
 emailDigest:z.boolean(),
 emailFrequency:z.enum(["Daily","Weekly"]),
 accountName:z.string().min(2).max(30),
 startingBalance:z.coerce.number().nonnegative(),
});
export const paperPositionSchema=z.object({
 accountId:z.string().min(1,"Create or choose an account"),market:z.enum(["Crypto","Forex","Futures","Stocks","Options"]),symbol:z.string().min(2).max(15),direction:z.enum(["Long","Short"]),entryPrice:z.coerce.number().positive(),currentPrice:z.coerce.number().positive(),quantity:z.coerce.number().positive(),leverage:z.coerce.number().min(1).max(200),openedAt:z.string().min(1),thesis:z.string().max(500)
});
