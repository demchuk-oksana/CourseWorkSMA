import { Category } from "../types/category";

// Example mock data that matches your screenshot
const mockCategoryTree: Category[] = [
  {
    id: 1,
    name: "Unity_Physics_Components",
    parentCategoryId: null,
    isExpanded: true,
    subcategories: [
      {
        id: 2,
        name: "Collision_Detection",
        parentCategoryId: 1,
        isExpanded: true,
        subcategories: [
          {
            id: 3,
            name: "Colliders",
            parentCategoryId: 2,
            isExpanded: true,
            subcategories: [],
            artifacts: [
              { id: 1, name: "BoxCollider_Implementation.cs" },
              { id: 2, name: "SphereCollider_Implementation.cs" },
              { id: 3, name: "MeshCollider_Implementation.cs" },
            ],
          },
          {
            id: 4,
            name: "Collision_Events",
            parentCategoryId: 2,
            isExpanded: true,
            subcategories: [],
            artifacts: [
              { id: 4, name: "OnCollisionEnter_Example.cs" },
              { id: 5, name: "TriggerDetection_System.cs" },
            ],
          },
        ],
        artifacts: [],
      },
      {
        id: 5,
        name: "Physical_Materials",
        parentCategoryId: 1,
        isExpanded: true,
        subcategories: [
          {
            id: 6,
            name: "Friction_Models",
            parentCategoryId: 5,
            isExpanded: true,
            subcategories: [],
            artifacts: [
              { id: 6, name: "Static_Friction_Calculator.cs" },
            ],
          },
        ],
        artifacts: [],
      },
      {
        id: 7,
        name: "Rigidbody",
        parentCategoryId: 1,
        isExpanded: true,
        subcategories: [
          {
            id: 8,
            name: "Forces_And_Torque",
            parentCategoryId: 7,
            isExpanded: true,
            subcategories: [],
            artifacts: [
              { id: 7, name: "AddForce_Implementation.cs" },
              { id: 8, name: "AddTorque_Example.cs" },
            ],
          },
        ],
        artifacts: [],
      },
    ],
    artifacts: [],
  },
];

// Simulate an API call
export const getCategoryTree = async (): Promise<Category[]> => {
  // Add a delay for realism
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockCategoryTree;
};