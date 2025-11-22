export interface DescriptionContent {
  content: string;
}

export interface SectionDescription {
  id: string;
  descriptions: DescriptionContent[];
}

export interface DescriptionCache {
  [sectionId: string]: SectionDescription;
}
