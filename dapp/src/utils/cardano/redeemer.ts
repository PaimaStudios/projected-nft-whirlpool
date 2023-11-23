import { Constr, Data, Redeemer } from "lucid-cardano";

export const EmptyRedeemer = Data.to(new Constr(0, []));

export const getRedeemer = ({
  partial_withdraw,
}: {
  partial_withdraw: boolean;
}): Redeemer => {
  const data = new Constr(1, [
    new Constr(0, [new Constr(0, []), new Constr(1, []), new Constr(1, [])]),
  ]);
  return Data.to(data);
};
