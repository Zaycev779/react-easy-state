import { expect, it } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { CreateState, createState } from "reasy-state";

it("create optional store", async () => {
    type TStore = {
        store:
            | {
                  value?: number;
              }
            | undefined;
    };
    const { useStore$value, setStore$value, getStore$value } =
        createState<TStore>()({
            store: undefined,
        });

    function Page() {
        const value = useStore$value() || 0;

        return <div>value: {value}</div>;
    }
    function Button() {
        return (
            <button onClick={() => setStore$value((prev) => (prev || 0) + 1)}>
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );
    expect(getStore$value()).toBe(undefined);
    await findByText("value: 0");
    fireEvent.click(getByText("button"));
    await findByText("value: 1");
});

it("create optional store width CreateState type", async () => {
    type UserStore = {
        id: number;
        data?: {
            rating: number;
        };
    };
    const userStore: CreateState<UserStore> = {
        id: 1,
    };

    const {
        useUserStore$data$rating,
        useUserStoreId,
        setUserStore$data$rating,
    } = createState({
        userStore,
    });

    let renderCountsId = 0;
    let renderCountsRating = 0;

    function Page1() {
        renderCountsId++;
        const id = useUserStoreId();

        return <div>id: {id}</div>;
    }

    function Page2() {
        renderCountsRating++;
        const rating = useUserStore$data$rating() || "-";

        return <div>rating: {rating}</div>;
    }

    function Button() {
        return (
            <button
                onClick={() =>
                    setUserStore$data$rating((prev) => (prev || 0) + 1)
                }
            >
                button
            </button>
        );
    }

    const { getByText, findByText } = render(
        <>
            <Page1 />
            <Page2 />
            <Button />
        </>,
    );
    expect(renderCountsId).toBe(1);
    expect(renderCountsRating).toBe(1);
    await findByText("id: 1");
    await findByText("rating: -");
    fireEvent.click(getByText("button"));
    await findByText("rating: 1");
    expect(renderCountsId).toBe(1);
    expect(renderCountsRating).toBe(2);
});

it("create optional store width any types", async () => {
    const state = createState<Record<string, any>>({ userStore: {} });

    function Page() {
        const value = state?.use$userStore$value();

        return <div>value: {value || "-"}</div>;
    }

    function Button() {
        return (
            <button onClick={() => state.set$userStore$value("new value")}>
                button
            </button>
        );
    }
    const { getByText, findByText } = render(
        <>
            <Page />
            <Button />
        </>,
    );
    expect(state?.get$userStore$value()).toBe(undefined);
    await findByText("value: -");
    fireEvent.click(getByText("button"));
    expect(state?.get$userStore$value()).toBe("new value");
    await findByText("value: new value");
});