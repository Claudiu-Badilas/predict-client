export type HeaderCardInput = {
  sections: CardSection[];
};

export type CardSection = {
  label: string;
  value: string | number | Date | null;
  pattern?: string | null;
  default: string | number | null;
  color: 'red' | 'green' | null;
};
