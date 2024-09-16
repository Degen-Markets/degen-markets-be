import { verifySignature } from "../cryptography";

describe("cryptography", () => {
  describe("verifySignature", () => {
    it("should return true for a valid signature", () => {
      const signature =
        "31q8WBjJuLcw8nodrRdmdSrDYT9GX5sZx75X2cGJSq4kftKDrESRwpeKp6xhTXbffZT4Hp8JADMjbScT4wrJqET";
      const address = "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
      const result = verifySignature(signature, address);
      expect(result).toBe(true);
    });

    it("should return false for an invalid signature", () => {
      const invalidSignature =
        "333Fkd3MzNhcvh8JBZM5CiaBqpnxh8mm91sg3rKAqn5sgUATSXeiRXVg5k6SZyb9PUjH9YtJUkyzyHYWDNeuku2h";
      const address = "rv9MdKVp2r13ZrFAwaES1WAQELtsSG4KEMdxur8ghXd";
      const result = verifySignature(invalidSignature, address);
      expect(result).toBe(false);
    });
  });
});
