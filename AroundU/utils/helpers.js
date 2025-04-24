import { useNavigation, CommonActions } from "@react-navigation/native";

// resets navigation stack to one screen only
export const resetNavigationStack = (navigation, screen) => {
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [
                { name: screen }
            ],
        })
    );
}